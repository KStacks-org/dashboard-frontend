import { expect, test } from "@playwright/test";
import { E2E_USERS, loginAsRotatedUser } from "./helpers";

test.describe("new sections and task workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRotatedUser(page);
  });

  test("quick-add creates a task assigned to me, and 'My tasks' keeps it visible", async ({
    page,
  }) => {
    const title = `مهمة سريعة ${Date.now()}`;

    await page.getByRole("textbox", { name: /Add a task and press Enter/ }).fill(title);
    await page.keyboard.press("Enter");

    const card = page.locator("article", { hasText: title });
    await expect(card).toBeVisible();
    await expect(card.getByText(E2E_USERS.rotated.displayName)).toBeVisible();

    // It is mine, so the "My tasks" filter must not hide it.
    await page.getByRole("button", { name: "My tasks" }).click();
    await expect(page.locator("article", { hasText: title })).toBeVisible();
  });

  test("search and filters narrow the list, and clearing restores it", async ({ page }) => {
    const unique = `فلترة${Date.now()}`;
    await page.getByRole("textbox", { name: /Add a task and press Enter/ }).fill(unique);
    await page.keyboard.press("Enter");
    await expect(page.locator("article", { hasText: unique })).toBeVisible();

    await page.getByRole("textbox", { name: "Search tasks..." }).fill("no-such-task-xyz");
    await expect(page.getByText("Nothing matches")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await expect(page.locator("article", { hasText: unique })).toBeVisible();
  });

  test("expands a task to read its subtasks, links and comments without any compose fields", async ({
    page,
  }) => {
    const title = `مهمة شجرية ${Date.now()}`;
    await page.getByRole("textbox", { name: /Add a task and press Enter/ }).fill(title);
    await page.keyboard.press("Enter");

    const card = page.locator("article", { hasText: title });

    // A task with nothing attached has nothing to expand.
    await expect(card.getByRole("button", { name: "Show details" })).toHaveCount(0);

    // Everything is added through the dialog.
    await card.getByRole("heading", { name: title }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByPlaceholder("Add a subtask...").fill("خطوة فرعية");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog.getByText("0 of 1 done")).toBeVisible();

    await dialog.getByRole("textbox", { name: "https://..." }).fill("https://kstacks.org");
    await dialog.getByRole("textbox", { name: /Label/ }).fill("الموقع");
    await dialog.getByRole("button", { name: "Add link" }).click();
    await expect(dialog.getByRole("link", { name: "الموقع" })).toBeVisible();

    await dialog.getByRole("textbox", { name: "Write an update..." }).fill("تعليق للقراءة");
    await dialog.getByRole("button", { name: "Comment" }).click();
    await expect(dialog.getByText("تعليق للقراءة")).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    // Collapsed by default; the chevron reveals all three, read-only.
    await expect(card.getByText("خطوة فرعية")).toHaveCount(0);
    await card.getByRole("button", { name: "Show details" }).click();

    await expect(card.getByText("خطوة فرعية")).toBeVisible();
    await expect(card.getByRole("link", { name: "الموقع" })).toBeVisible();
    await expect(card.getByText("تعليق للقراءة")).toBeVisible();

    // Reading mode carries no compose fields — those stay in the dialog.
    await expect(card.getByPlaceholder("Add a subtask...")).toHaveCount(0);
    await expect(card.getByRole("textbox", { name: "https://..." })).toHaveCount(0);
    await expect(card.getByRole("textbox", { name: "Write an update..." })).toHaveCount(0);

    await card.getByRole("button", { name: "Hide details" }).click();
    await expect(card.getByText("خطوة فرعية")).toHaveCount(0);
  });

  test("assigns a subtask and blocks removing that person from the parent task", async ({
    page,
  }) => {
    const title = `مهمة إسناد ${Date.now()}`;

    await page.getByRole("button", { name: "New task" }).first().click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByRole("combobox", { name: "Assignees" }).click();
    await page.getByRole("option", { name: new RegExp(E2E_USERS.rotated.username) }).click();
    await page.getByRole("option", { name: new RegExp(E2E_USERS.other.username) }).click();
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByRole("dialog", { name: "New task" })).toBeHidden();

    // Give the second person a subtask.
    const card = page.locator("article", { hasText: title });
    await card.getByRole("heading", { name: title }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Add a subtask...").fill("جزء زميلي");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();

    await dialog.getByRole("combobox", { name: /Owner: جزء زميلي/ }).click();
    await page.getByRole("option", { name: E2E_USERS.other.displayName }).click();
    await expect(dialog.getByText(E2E_USERS.other.displayName).first()).toBeVisible();

    // Close the detail dialog itself; Escape above only dismissed the select.
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    // Now try to drop them from the parent task — the server must refuse.
    await card.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Edit task" }).click();

    dialog = page.getByRole("dialog", { name: "Edit task" });
    await dialog.getByRole("button", { name: `Remove ${E2E_USERS.other.displayName}` }).click();
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(dialog.getByRole("alert")).toContainText(E2E_USERS.other.displayName);
    await expect(dialog).toBeVisible();
  });

  test("moves a task across board columns", async ({ page }) => {
    const title = `مهمة اللوحة ${Date.now()}`;
    await page.getByRole("textbox", { name: /Add a task and press Enter/ }).fill(title);
    await page.keyboard.press("Enter");
    await expect(page.locator("article", { hasText: title })).toBeVisible();

    await page.getByRole("tab", { name: "Board" }).click();

    // New tasks start in "To do".
    const todoColumn = page.locator("section", { hasText: "To do" }).first();
    await expect(todoColumn.getByText(title)).toBeVisible();

    // Change status through the edit form (equivalent to dropping in a column).
    await page.getByRole("tab", { name: "List" }).click();
    const card = page.locator("article", { hasText: title });
    await card.getByRole("button", { name: `${title} — actions` }).click();
    await page.getByRole("menuitem", { name: "Edit task" }).click();

    const dialog = page.getByRole("dialog", { name: "Edit task" });
    await dialog.getByLabel("Status").click();
    await page.getByRole("option", { name: "In progress" }).click();
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("tab", { name: "Board" }).click();
    const inProgress = page.locator("section", { hasText: "In progress" }).first();
    await expect(inProgress.getByText(title)).toBeVisible();
  });

  test("posts a comment and attaches a link, rejecting a dangerous URL", async ({ page }) => {
    const title = `مهمة نقاش ${Date.now()}`;
    await page.getByRole("textbox", { name: /Add a task and press Enter/ }).fill(title);
    await page.keyboard.press("Enter");

    await page.locator("article", { hasText: title }).getByRole("heading", { name: title }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("textbox", { name: "Write an update..." }).fill("جاري العمل عليها");
    await dialog.getByRole("button", { name: "Comment" }).click();
    await expect(dialog.getByText("جاري العمل عليها")).toBeVisible();

    await dialog.getByRole("textbox", { name: "https://..." }).fill("javascript:alert(1)");
    await dialog.getByRole("button", { name: "Add link" }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();

    await dialog
      .getByRole("textbox", { name: "https://..." })
      .fill("https://github.com/KStacks-org");
    await dialog.getByRole("textbox", { name: /Label/ }).fill("Org");
    await dialog.getByRole("button", { name: "Add link" }).click();
    await expect(dialog.getByRole("link", { name: "Org" })).toBeVisible();
  });

  test("services section lists the real KStack services and opens one", async ({ page }) => {
    await page.getByRole("link", { name: "Services" }).first().click();
    await expect(page.getByRole("heading", { name: "Services", exact: true })).toBeVisible();

    for (const name of ["Index", "Planner", "Groups", "Grades"]) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }

    await page.getByRole("link", { name: /Index/ }).first().click();
    await expect(page).toHaveURL(/\/services\/kindex/);
    await expect(page.getByRole("heading", { name: "Index", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "About this service" })).toBeVisible();
  });

  test("saves a service overview so the team can document it", async ({ page }) => {
    await page.goto("/services/kgroups");
    const overview = `نبذة اختبارية ${Date.now()}`;

    await page.getByRole("button", { name: "Edit details" }).click();
    await page.getByLabel("About this service").fill(overview);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText(overview)).toBeVisible();

    // Survives a reload — proving it persisted.
    await page.reload();
    await expect(page.getByText(overview)).toBeVisible();
  });

  test("health board lists every service with a status", async ({ page }) => {
    await page.getByRole("link", { name: "Health" }).first().click();
    await expect(page.getByRole("heading", { name: "Service health" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Index" })).toBeVisible();
  });

  test("creates, edits and deletes a sponsored project", async ({ page }) => {
    const name = `مشروع اختبار ${Date.now()}`;

    await page.getByRole("link", { name: "Projects" }).first().click();
    await expect(page.getByRole("heading", { name: "Sponsored projects" })).toBeVisible();

    await page.getByRole("button", { name: "Add project" }).first().click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Project name").fill(name);
    await dialog.getByLabel("Description").fill("مشروع طلابي مدعوم");
    await dialog.getByLabel("Student / team").fill("طالب تجريبي");
    await dialog.getByLabel("Status").click();
    await page.getByRole("option", { name: "Active" }).click();
    await dialog.getByRole("button", { name: "Add project" }).click();
    await expect(dialog).toBeHidden();

    const card = page.locator("article", { hasText: name });
    await expect(card).toBeVisible();
    await expect(card.getByText("Active")).toBeVisible();

    await card.getByRole("button", { name: `${name} — actions` }).click();
    await page.getByRole("menuitem", { name: "Edit project" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Status").click();
    await page.getByRole("option", { name: "Launched" }).click();
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("article", { hasText: name }).getByText("Launched")).toBeVisible();

    await page
      .locator("article", { hasText: name })
      .getByRole("button", { name: `${name} — actions` })
      .click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("article", { hasText: name })).toHaveCount(0);
  });
});
