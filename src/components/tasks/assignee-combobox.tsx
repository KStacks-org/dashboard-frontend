import { useQuery } from "@tanstack/react-query";
import { CheckIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { teamMembersQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

/**
 * Multi-select assignee picker. Search matches on display name, so Arabic names
 * work as typed; selection is always tracked by database id, never by name.
 */
export function AssigneeCombobox({
  id,
  labelledBy,
  selectedIds,
  onChange,
  invalid,
}: {
  /** Id of the trigger, so an external <Label htmlFor> can point at it. */
  id: string;
  /**
   * Id of the visible field label. `role="combobox"` does not take its
   * accessible name from its contents, so it must be labelled explicitly.
   */
  labelledBy: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [], isPending } = useQuery(teamMembersQuery);

  const selected = members.filter((member) => selectedIds.includes(member.id));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-labelledby={labelledBy}
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            className="w-full justify-start font-normal text-muted-foreground"
            disabled={isPending}
          >
            <UserPlusIcon aria-hidden="true" />
            {m.task_assignees_placeholder()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="start">
          <Command
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
            }
          >
            <CommandInput placeholder={m.task_assignees_placeholder()} />
            <CommandList>
              <CommandEmpty>{m.task_assignees_empty()}</CommandEmpty>
              <CommandGroup>
                {members.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <CommandItem
                      key={member.id}
                      // Include the email so the two "ياسر" accounts stay distinguishable.
                      value={`${member.displayName} ${member.email}`}
                      onSelect={() => toggle(member.id)}
                    >
                      <span
                        className="flex size-4 items-center justify-center rounded-sm border border-border data-[selected=true]:border-primary data-[selected=true]:bg-primary"
                        data-selected={isSelected}
                        aria-hidden="true"
                      >
                        {isSelected && <CheckIcon className="size-3 text-primary-foreground" />}
                      </span>
                      <span dir="auto" className="flex-1 truncate">
                        {member.displayName}
                      </span>
                      <span
                        className="max-w-[10rem] truncate text-xs text-muted-foreground"
                        dir="ltr"
                        title={member.email}
                      >
                        {member.email}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((member) => (
            <li key={member.id}>
              <Badge variant="secondary" className="gap-1 ps-2.5 pe-1">
                <span dir="auto" className="truncate">
                  {member.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(member.id)}
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={`Remove ${member.displayName}`}
                >
                  <XIcon className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
