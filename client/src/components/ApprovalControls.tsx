/**
 * Owner 승인/반려 UI
 * Day 10: Phase 2-B
 */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateReportApproval } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApprovalControlsProps {
  reportId: string;
  onSuccess?: () => void;
}

export default function ApprovalControls({ reportId, onSuccess }: ApprovalControlsProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: (status: "APPROVED" | "REJECTED") =>
      updateReportApproval(reportId, { status, comment: comment.trim() || undefined }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      queryClient.invalidateQueries({ queryKey: ["item"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(status === "APPROVED" ? "승인되었습니다." : "반려되었습니다.");
      setComment("");
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "처리에 실패했습니다.";
      toast.error(msg ?? "처리에 실패했습니다.");
    },
  });

  return (
    <section>
      <h3 className="font-semibold mb-2">Approval</h3>
      <div className="space-y-3">
        <Textarea
          placeholder="코멘트 (선택)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px] text-sm bg-secondary border-border"
          rows={2}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 text-success hover:text-success hover:bg-success/10"
            onClick={() => mutation.mutate("APPROVED")}
            disabled={mutation.isPending}
          >
            <CheckCircle2 size={16} />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            onClick={() => mutation.mutate("REJECTED")}
            disabled={mutation.isPending}
          >
            <XCircle size={16} />
            Reject
          </Button>
        </div>
      </div>
    </section>
  );
}
