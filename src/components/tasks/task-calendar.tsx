import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarXIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { dayKeyOf, formatMonthYear, isOverdue, toLocalDayKey } from "@/lib/format";
import { currentLocale } from "@/lib/i18n";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

const WEEK_STARTS_ON = 0; // Sunday — the working-week convention in KSA.

function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const reference = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(reference.getTime() + i * 86400000)),
  );
}

/**
 * Month grid driven by the exact same task array the list view renders — there
 * is no separate calendar data source.
 */
export function TaskCalendar({
  tasks,
  onSelectTask,
}: {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const locale = currentLocale() === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), {
          weekStartsOn: WEEK_STARTS_ON,
        }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
      }),
    [month],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const key = toLocalDayKey(task.deadline);
      const bucket = map.get(key);
      if (bucket) bucket.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  const tasksThisMonth = days
    .filter((day) => isSameMonth(day, month))
    .some((day) => tasksByDay.has(dayKeyOf(day)));

  const weekdays = weekdayLabels(locale);
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{formatMonthYear(month)}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((current) => subMonths(current, 1))}
            aria-label="Previous month"
          >
            {/* Directional icon mirrors under RTL; the brand marks never do. */}
            <ChevronLeftIcon className="rtl:-scale-x-100" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            {new Intl.DateTimeFormat(locale, { month: "short" }).format(today)}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {!tasksThisMonth && (
        <EmptyState
          icon={CalendarXIcon}
          title={m.empty_calendar_body()}
          body={m.empty_tasks_body()}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {weekdays.map((label) => (
            <div
              key={label}
              className="truncate px-1 py-2 text-center text-[11px] font-medium text-muted-foreground sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTasks = tasksByDay.get(dayKeyOf(day)) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-20 border-b border-e border-border p-1 last:border-e-0 sm:min-h-28 sm:p-1.5 ${
                  inMonth ? "" : "bg-muted/20"
                }`}
              >
                <div
                  className={`mb-1 inline-flex size-5 items-center justify-center rounded text-[11px] sm:text-xs ${
                    isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {day.getDate()}
                </div>

                <ul className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        title={task.title}
                        dir="auto"
                        className={`w-full truncate rounded px-1 py-0.5 text-start text-[10px] leading-tight transition-colors sm:text-[11px] ${
                          isOverdue(task.deadline)
                            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "bg-primary/15 text-primary hover:bg-primary/25"
                        }`}
                      >
                        {task.title}
                      </button>
                    </li>
                  ))}
                  {dayTasks.length > 3 && (
                    <li className="px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
