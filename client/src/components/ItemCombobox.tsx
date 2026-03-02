/**
 * 리포트 폼 내 Item 검색/선택 + "새로 만들기"
 */

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ItemListItem } from "@shared/types";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import ItemCreateDialog from "./ItemCreateDialog";

interface ItemComboboxProps {
  items: ItemListItem[];
  value: string | null;
  onValueChange: (itemId: string | null, tagNumber?: string) => void;
  projectId: string;
  makerId: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ItemCombobox({
  items,
  value,
  onValueChange,
  projectId,
  makerId,
  placeholder = "Item 선택...",
  disabled,
}: ItemComboboxProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = items.find((i) => i.id === value);

  const handleCreateNew = () => {
    setOpen(false);
    setCreateOpen(true);
  };

  const handleCreated = (item: ItemListItem) => {
    onValueChange(item.id, item.tagNumber);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {selected ? (
              <span className="truncate">
                {selected.tagNumber}
                {selected.description && (
                  <span className="text-muted-foreground ml-2">
                    {selected.description}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tag No 검색..." />
            <CommandList>
              <CommandEmpty>목록에 없습니다.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.tagNumber} ${item.description ?? ""}`}
                    onSelect={() => {
                      onValueChange(item.id, item.tagNumber);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{item.tagNumber}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                <CommandItem onSelect={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-primary font-medium">Create New Item...</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ItemCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        makerId={makerId}
        onCreated={handleCreated}
      />
    </>
  );
}
