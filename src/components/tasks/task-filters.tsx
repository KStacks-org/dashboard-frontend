import { useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { isOverdue } from "@/lib/format";
import { servicesQuery, teamMembersQuery } from "@/lib/queries";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const ALL = "__all__";

export type TaskFilters = {
  search: string;
  serviceId: string;
  priority: string;
  status: string;
  assigneeId: string;
  overdueOnly: boolean;
  mineOnly: boolean;
};

export const EMPTY_FILTERS: TaskFilters = {
  search: "",
  serviceId: ALL,
  priority: ALL,
  status: ALL,
  assigneeId: ALL,
  overdueOnly: false,
  mineOnly: false,
};

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.serviceId !== ALL ||
    filters.priority !== ALL ||
    filters.status !== ALL ||
    filters.assigneeId !== ALL ||
    filters.overdueOnly ||
    filters.mineOnly
  );
}

/**
 * Filtering runs over the already-fetched list rather than re-querying, so
 * typing stays instant and switching views never costs a round-trip.
 */
export function filterTasks(tasks: Task[], filters: TaskFilters, currentUserId: string): Task[] {
  const search = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (search) {
      const haystack = [
        task.title,
        task.description ?? "",
        `ks-${task.reference}`,
        task.service?.name ?? "",
        ...task.assignees.map((a) => a.user.displayName),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.serviceId !== ALL && task.serviceId !== filters.serviceId) return false;
    if (filters.priority !== ALL && task.priority !== filters.priority) return false;
    if (filters.status !== ALL && task.status !== filters.status) return false;

    if (
      filters.assigneeId !== ALL &&
      !task.assignees.some((a) => a.userId === filters.assigneeId)
    ) {
      return false;
    }

    if (filters.mineOnly && !task.assignees.some((a) => a.userId === currentUserId)) {
      return false;
    }

    if (filters.overdueOnly && !isOverdue(task.deadline)) return false;

    return true;
  });
}

export function TaskFiltersBar({
  filters,
  onChange,
  shown,
  total,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  shown: number;
  total: number;
}) {
  const { data: services = [] } = useQuery(servicesQuery);
  const { data: members = [] } = useQuery(teamMembersQuery);

  const set = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon
            className="pointer-events-none absolute inset-inline-start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder={m.filters_search_placeholder()}
            aria-label={m.filters_search_placeholder()}
            className="ps-8"
          />
        </div>

        <Toggle
          pressed={filters.mineOnly}
          onPressedChange={(pressed) => set("mineOnly", pressed)}
          variant="outline"
          size="sm"
        >
          {m.filters_mine_only()}
        </Toggle>

        <Toggle
          pressed={filters.overdueOnly}
          onPressedChange={(pressed) => set("overdueOnly", pressed)}
          variant="outline"
          size="sm"
        >
          {m.filters_overdue_only()}
        </Toggle>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger
            size="sm"
            className="w-auto min-w-[8rem]"
            aria-label={m.task_status_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{m.filters_all_statuses()}</SelectItem>
            <SelectItem value="TODO">{m.status_todo()}</SelectItem>
            <SelectItem value="IN_PROGRESS">{m.status_in_progress()}</SelectItem>
            <SelectItem value="BLOCKED">{m.status_blocked()}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => set("priority", v)}>
          <SelectTrigger
            size="sm"
            className="w-auto min-w-[8rem]"
            aria-label={m.task_priority_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{m.filters_all_priorities()}</SelectItem>
            <SelectItem value="HIGH">{m.priority_high()}</SelectItem>
            <SelectItem value="MEDIUM">{m.priority_medium()}</SelectItem>
            <SelectItem value="LOW">{m.priority_low()}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.serviceId} onValueChange={(v) => set("serviceId", v)}>
          <SelectTrigger
            size="sm"
            className="w-auto min-w-[8rem]"
            aria-label={m.task_service_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{m.filters_all_services()}</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.assigneeId} onValueChange={(v) => set("assigneeId", v)}>
          <SelectTrigger
            size="sm"
            className="w-auto min-w-[9rem]"
            aria-label={m.task_assignees_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{m.filters_all_people()}</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {active && (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            <XIcon aria-hidden="true" />
            {m.filters_clear()}
          </Button>
        )}

        {active && (
          <span className="text-xs text-muted-foreground">
            {m.filters_result_count({ shown, total })}
          </span>
        )}
      </div>
    </div>
  );
}
