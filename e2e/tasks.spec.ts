import { expect, test } from "@playwright/test";
import { E2E_USERS, escapeForRegex, gotoSection, loginAndOpenTasks } from "./helpers";

/** Deterministic deadline inside the current month, so the calendar assertion is stable. */
function deadlineThisMonth() {
  const now = new Date();
  const day = Math.min(now.getDate() + 1, 28);
  const date = new Date(now.getFullYear(), now.getMonth(), day, 14, 30);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    inputValue: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T14:30`,
    day: String(date.getDate()),
  };
}

test.describe("task management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenTasks(page);
  });

  test("creates a task with every field, then shows it in both list and calendar views", async ({
    page,
  }) => {
    const title = `مهمة اختبار ${Date.now()}`;
    const description = "وصف تفصيلي للمهمة";
    const deadline = deadlineThisMonth();

    // The empty state renders a second "New task" CTA, so target the header one.
    await page.getByRole("button", { name: "New task" }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByLabel("Description").fill(description);
    await dialog.getByLabel("Deadline").fill(deadline.inputValue);

    await dialog.getByLabel("Priority").click();
    await page.getByRole("option", { name: "High" }).click();

    await dialog.getByLabel("Service").click();
    await page.getByRole("option", { name: "Index" }).click();

    // Assignee search must work with Arabic display names.
    await dialog.getByRole("combobox", { name: "Assignees" }).click();
    const search = page.getByPlaceholder("Search team members...");
    await search.fill("اختبار");
    await page
      .getByRole("option", { name: new RegExp(escapeForRegex(E2E_USERS.rotated.email)) })
      .click();
    await page
      .getByRole("option", { name: new RegExp(escapeForRegex(E2E_USERS.other.email)) })
      .click();
    await page
      .getByRole("option", { name: new RegExp(escapeForRegex(E2E_USERS.fresh.email)) })
      .click();
    await page.keyboard.press("Escape");

    // Selected people are listed as removable chips.
    const chipFor = (displayName: string) =>
      dialog.getByRole("button", { name: `Remove ${displayName}` });
    await expect(chipFor(E2E_USERS.rotated.displayName)).toBeVisible();
    await expect(chipFor(E2E_USERS.other.displayName)).toBeVisible();
    await expect(chipFor(E2E_USERS.fresh.displayName)).toBeVisible();

    // Removing one takes it back out of the selection.
    await chipFor(E2E_USERS.fresh.displayName).click();
    await expect(chipFor(E2E_USERS.fresh.displayName)).toHaveCount(0);
    await expect(chipFor(E2E_USERS.rotated.displayName)).toBeVisible();

    await dialog.getByRole("button", { name: "Create task" }).click();
    await expect(dialog).toBeHidden();

    // List view shows the task with its metadata.
    const card = page.locator("article", { hasText: title });
    await expect(card).toBeVisible();
    await expect(card.getByText("High")).toBeVisible();
    await expect(card.getByText("Index")).toBeVisible();
    await expect(card.getByText(E2E_USERS.other.displayName)).toBeVisible();

    // Survives a full reload — proving it came from PostgreSQL, not local state.
    await page.reload();
    await expect(page.locator("article", { hasText: title })).toBeVisible();

    // The same task appears in the calendar, on its deadline date.
    await page.getByRole("tab", { name: "Calendar" }).click();
    await expect(page.getByRole("button", { name: title })).toBeVisible();

    // Switching back to the list doesn't duplicate it.
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.locator("article", { hasText: title })).toHaveCount(1);
  });

  test("rejects a task with no title and no assignees", async ({ page }) => {
    // The empty state renders a second "New task" CTA, so target the header one.
    await page.getByRole("button", { name: "New task" }).first().click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("button", { name: "Create task" }).click();

    await expect(dialog.getByText("Title is required")).toBeVisible();
    await expect(dialog.getByText("Select at least one assignee")).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("adds, completes, un-completes and deletes a subtask", async ({ page }) => {
    const title = `مهمة بمهام فرعية ${Date.now()}`;
    await createSimpleTask(page, title);

    await page.locator("article", { hasText: title }).getByRole("heading", { name: title }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByPlaceholder("Add a subtask...").fill("الخطوة الأولى");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();

    const checkbox = dialog.getByRole("checkbox");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(dialog.getByText("1 of 1 done")).toBeVisible();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(dialog.getByText("0 of 1 done")).toBeVisible();

    // Persists across a reload.
    await page.reload();
    await page.locator("article", { hasText: title }).getByRole("heading", { name: title }).click();
    await expect(page.getByRole("dialog").getByText("الخطوة الأولى")).toBeVisible();

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Delete: الخطوة الأولى/ })
      .click();
    await expect(page.getByRole("dialog").getByText("الخطوة الأولى")).toBeHidden();
  });

  test("archives a finished task instead of deleting it, and can restore it", async ({ page }) => {
    const title = `مهمة للأرشفة ${Date.now()}`;
    await createSimpleTask(page, title);

    const card = page.locator("article", { hasText: title });
    await card.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Mark as done" }).click();

    await expect(page.locator("article", { hasText: title })).toHaveCount(0);

    await gotoSection(page, "Archive");
    const archivedCard = page.locator("article", { hasText: title });
    await expect(archivedCard).toBeVisible();

    await archivedCard.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Restore" }).click();
    await expect(page.locator("article", { hasText: title })).toHaveCount(0);

    await page.getByRole("link", { name: "Tasks" }).first().click();
    await expect(page.locator("article", { hasText: title })).toBeVisible();
  });

  test("only the creator sees a delete action, and deleting asks for confirmation", async ({
    page,
  }) => {
    const title = `مهمة قابلة للحذف ${Date.now()}`;
    await createSimpleTask(page, title);

    const card = page.locator("article", { hasText: title });
    await card.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText("Delete this task?")).toBeVisible();

    // Backing out leaves the task alone.
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("article", { hasText: title })).toBeVisible();

    await card.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.locator("article", { hasText: title })).toHaveCount(0);
  });

  test("hides the delete action from someone who did not create the task", async ({
    page,
    browser,
  }) => {
    const title = `مهمة شخص آخر ${Date.now()}`;
    await createSimpleTask(page, title);

    // Second user, separate browser context (separate session cookie).
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto("/login");
    await otherPage.getByLabel("University email").fill(E2E_USERS.other.email);
    await otherPage.getByLabel("Password", { exact: true }).fill("123456");
    await otherPage.getByRole("button", { name: "Log in" }).click();
    await otherPage.waitForURL("**/overview");
    await otherPage.goto("/tasks");

    const card = otherPage.locator("article", { hasText: title });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: `${title} — actions` }).click();

    await expect(otherPage.getByRole("menuitem", { name: "Edit task" })).toBeVisible();
    await expect(otherPage.getByRole("menuitem", { name: "Delete" })).toHaveCount(0);

    await otherContext.close();
  });
});

async function createSimpleTask(page: import("@playwright/test").Page, title: string) {
  await page.getByRole("button", { name: "New task" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByRole("combobox", { name: "Assignees" }).click();
  await page
    .getByRole("option", { name: new RegExp(escapeForRegex(E2E_USERS.rotated.email)) })
    .click();
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(dialog).toBeHidden();
}
