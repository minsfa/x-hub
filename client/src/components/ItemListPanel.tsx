/**
 * Workspace 좌측: Maker의 Item 목록
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ItemListItem } from "@shared/types";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

interface ItemListPanelProps {
  items: ItemListItem[];
  isLoading: boolean;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onAddItem?: () => void;
}

export default function ItemListPanel({
  items,
  isLoading,
  selectedItemId,
  onSelectItem,
  onAddItem,
}: ItemListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = items.filter(
    (i) =>
      i.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Items</h2>
            <span className="text-xs text-muted-foreground">Total: {items.length}</span>
          </div>
          {onAddItem && (
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onAddItem}>
              <Plus size={14} />
              Add
            </Button>
          )}
        </div>
        <div className="relative mt-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search Tag No..."
            className="pl-8 h-8 text-sm bg-secondary border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-1 transition-all",
                  selectedItemId === item.id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-secondary/50 border-l-2 border-l-transparent"
                )}
              >
                <p className="font-semibold text-sm font-mono-data">{item.tagNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {item.description ?? "-"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {item.reportCount} rpt
                  </span>
                  {item.latestReportStatus === "PENDING" && (
                    <span className="text-xs text-alert font-medium">1 pnd</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
