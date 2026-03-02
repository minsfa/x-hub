/**
 * 리포트 업로드 폼 (Maker 전용)
 * Day 8: Phase 2-B
 * Item 선택/신규 생성 통합
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReport, fetchInspectionCompanies } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemListItem } from "@shared/types";
import { FileUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ItemCombobox from "./ItemCombobox";

const REPORT_TYPES = ["RT", "MT", "UT", "HT", "PMI", "VT", "OTHER"] as const;

interface ReportUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  makerId: string;
  items: ItemListItem[];
  /** 기존: Item 패널에서 선택 후 열 때 pre-select */
  initialItemId?: string | null;
  onSuccess?: () => void;
}

export default function ReportUploadForm({
  open,
  onOpenChange,
  projectId,
  makerId,
  items,
  initialItemId = null,
  onSuccess,
}: ReportUploadFormProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState<string | null>(initialItemId);
  const [reportNo, setReportNo] = useState("");
  const [reportType, setReportType] = useState<string>("RT");
  const [inspectionCompanyId, setInspectionCompanyId] = useState("");
  const [issuedDate, setIssuedDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [inspector, setInspector] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ["inspection-companies"],
    queryFn: fetchInspectionCompanies,
    enabled: open,
  });

  useEffect(() => {
    if (open) setItemId(initialItemId);
  }, [open, initialItemId]);

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess: (_, variables) => {
      const id = variables.get("itemId") as string;
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items", projectId, makerId] });
      toast.success("리포트가 업로드되었습니다.");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "업로드에 실패했습니다.";
      toast.error(msg ?? "업로드에 실패했습니다.");
    },
  });

  const resetForm = () => {
    setItemId(initialItemId);
    setReportNo("");
    setReportType("RT");
    setInspectionCompanyId("");
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setInspector("");
    setFiles(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      toast.error("Item을 선택하세요.");
      return;
    }
    if (!reportNo.trim() || !inspectionCompanyId || !issuedDate) {
      toast.error("필수 항목을 입력하세요.");
      return;
    }
    if (!files || files.length === 0) {
      toast.error("파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("itemId", itemId);
    formData.append("reportNo", reportNo.trim());
    formData.append("reportType", reportType);
    formData.append("inspectionCompanyId", inspectionCompanyId);
    formData.append("issuedDate", issuedDate);
    if (inspector.trim()) {
      formData.append("tags", JSON.stringify({ inspector: inspector.trim() }));
    }
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp size={20} />
            New Report Upload
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Item *</Label>
            <ItemCombobox
              items={items}
              value={itemId}
              onValueChange={(id) => setItemId(id)}
              projectId={projectId}
              makerId={makerId}
              placeholder="Item 선택 또는 새로 만들기..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportNo">Report No *</Label>
            <Input
              id="reportNo"
              placeholder="KG-DALMA-RT-004"
              value={reportNo}
              onChange={(e) => setReportNo(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionCompany">Inspection Company *</Label>
            <Select
              value={inspectionCompanyId}
              onValueChange={setInspectionCompanyId}
              required
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued Date *</Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspector">Inspector</Label>
            <Input
              id="inspector"
              placeholder="S.K.Kim"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Files (PDF) *</Label>
            <Input
              id="files"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="bg-secondary border-border"
            />
            {files && files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length}개 파일 선택
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "업로드 중..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
