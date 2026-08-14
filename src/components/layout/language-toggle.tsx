import { LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentLocale, switchLocale } from "@/lib/i18n";
import { m } from "@/paraglide/messages";

/**
 * Flips the whole app between English (LTR) and Arabic (RTL).
 * Paraglide persists the choice in a cookie and reloads, so <html dir> is
 * re-applied from scratch on the next render — no per-component flipping.
 */
export function LanguageToggle() {
  const locale = currentLocale();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => switchLocale(next)}
      aria-label={`Switch to ${next === "ar" ? "العربية" : "English"}`}
    >
      <LanguagesIcon aria-hidden="true" />
      {m.language_switch()}
    </Button>
  );
}
