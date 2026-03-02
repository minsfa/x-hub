/**
 * Item 단건 생성 모달
 * 리포트 폼에서도 호출 가능
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createItem } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ItemListItem } from "@shared/types";

interface ItemCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  makerId: string;
  onCreated?: (item: ItemListItem) => void;
}

export default function ItemCreateDialog({
  open,
  onOpenChange,
  projectId,
  makerId,
  onCreated,
}: ItemCreateDialogProps) {
  const queryClient = useQueryClient();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [drawingNo, setDrawingNo] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createItem(projectId, makerId, {
        number: number.trim(),
        name: name.trim() || undefined,
        drawingNo: drawingNo.trim() || undefined,
      }),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["items", projectId, makerId] });
      toast.success("Item이 생성되었습니다.");
      onOpenChange(false);
      resetForm();
      onCreated?.(item);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "생성에 실패했습니다.";
      toast.error(msg ?? "생성에 실패했습니다.");
    },
  });

  const resetForm = () => {
    setNumber("");
    setName("");
    setDrawingNo("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      toast.error("Tag No를 입력하세요.");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={20} />
            Create New Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="item-number">Tag No *</Label>
            <Input
              id="item-number"
              placeholder="AZ5172-V-005"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-name">Name / Description</Label>
            <Input
              id="item-name"
              placeholder="Water Flash Vessel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-drawingNo">Drawing No</Label>
            <Input
              id="item-drawingNo"
              placeholder="DWG-2026-001"
              value={drawingNo}
              onChange={(e) => setDrawingNo(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "생성 중..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
