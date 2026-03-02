/**
 * Item 엑셀 일괄 등록
 * 업로드 → 미리보기 → 일괄 등록
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkCreateItems, fetchItemsByMaker } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ItemBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  makerId: string;
}

interface ParsedRow {
  number: string;
  name: string;
  status: "new" | "duplicate";
}

const TEMPLATE_ROWS = [
  { Number: "AZ5172-V-005", Name: "Pressure Vessel" },
  { Number: "AZ5172-V-006", Name: "Storage Tank" },
  { Number: "AZ5172-E-002", Name: "Heat Exchanger" },
];

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  XLSX.writeFile(wb, "item-import-template.xlsx");
}

function parseExcelFile(file: File): Promise<Omit<ParsedRow, "status">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("파일을 읽을 수 없습니다."));
          return;
        }
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const result: Omit<ParsedRow, "status">[] = [];
        const numKey = ["Number", "number", "Tag No", "tagNo", "No", "no"].find(
          (k) => rows[0] && k in (rows[0] ?? {})
        );
        const nameKey = ["Name", "name", "Description", "description"].find(
          (k) => rows[0] && k in (rows[0] ?? {})
        );
        const numCol = numKey ?? "Number";
        const nameCol = nameKey ?? "Name";

        for (const row of rows) {
          const num = String(row[numCol] ?? row["Number"] ?? row["number"] ?? "").trim();
          if (!num) continue;
          const name = String(
            row[nameCol] ?? row["Name"] ?? row["name"] ?? ""
          ).trim();
          result.push({ number: num, name });
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsBinaryString(file);
  });
}

export default function ItemBulkImport({
  open,
  onOpenChange,
  projectId,
  makerId,
}: ItemBulkImportProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);

  const { data: existingItems = [] } = useQuery({
    queryKey: ["items", projectId, makerId],
    queryFn: () => fetchItemsByMaker(projectId, makerId),
    enabled: open && !!projectId && !!makerId,
  });

  const bulkMutation = useMutation({
    mutationFn: (items: Array<{ number: string; name?: string }>) =>
      bulkCreateItems(projectId, makerId, items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items", projectId, makerId] });
      toast.success(`${data.created.length}개 Item이 등록되었습니다.`);
      if (data.skipped.length > 0) {
        toast.info(`중복으로 건너뜀: ${data.skipped.join(", ")}`);
      }
      onOpenChange(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "일괄 등록에 실패했습니다.";
      toast.error(msg ?? "일괄 등록에 실패했습니다.");
    },
  });

  const reset = useCallback(() => {
    setPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const markStatus = useCallback(
    (rows: Omit<ParsedRow, "status">[]): ParsedRow[] => {
      const existing = new Set(existingItems.map((i) => i.tagNumber));
      return rows.map((r) => ({
        ...r,
        status: existing.has(r.number) ? "duplicate" : "new",
      }));
    },
    [existingItems]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        toast.error("유효한 데이터가 없습니다. Number 컬럼을 확인하세요.");
        return;
      }
      setPreview(markStatus(rows));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "파일 파싱 실패");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("엑셀 파일(.xlsx, .xls)만 지원합니다.");
      return;
    }
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        toast.error("유효한 데이터가 없습니다.");
        return;
      }
      setPreview(markStatus(rows));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "파일 파싱 실패");
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleImport = () => {
    const toImport = preview.filter((r) => r.status === "new" && r.number.trim());
    if (toImport.length === 0) {
      toast.error("등록할 신규 Item이 없습니다.");
      return;
    }
    bulkMutation.mutate(toImport.map((r) => ({ number: r.number, name: r.name || undefined })));
  };

  const newCount = preview.filter((r) => r.status === "new").length;
  const dupCount = preview.filter((r) => r.status === "duplicate").length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} />
            Item Bulk Import
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          엑셀 파일을 업로드하면 Item을 일괄 등록합니다.
        </p>

        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-1.5"
          onClick={downloadTemplate}
        >
          <Download size={16} />
          Download Template
        </Button>

        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-sm text-muted-foreground">
            엑셀 파일을 드래그하세요 또는 <span className="text-primary font-medium">파일 선택</span>
          </p>
        </div>

        {preview.length > 0 && (
          <>
            <div className="text-sm font-medium">Preview</div>
            <div className="border rounded-lg overflow-auto max-h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{row.number}</TableCell>
                      <TableCell>{row.name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={
                            row.status === "new"
                              ? "text-green-600 text-xs"
                              : "text-muted-foreground text-xs"
                          }
                        >
                          {row.status === "new" ? "신규" : "중복"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              신규: {newCount}건 {dupCount > 0 && `| 중복(건너뜀): ${dupCount}건`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => reset()}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={bulkMutation.isPending || newCount === 0}
              >
                {bulkMutation.isPending ? "등록 중..." : `Import ${newCount} Items`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
