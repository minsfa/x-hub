/**
 * PDF 인라인 뷰어 (react-pdf)
 * Day 9: Phase 2-B
 */

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Vite: worker URL 직접 import
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  url: string;
  className?: string;
}

export default function PdfViewer({ url, className = "" }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || "PDF 로드 실패");
  };

  if (!url) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        PDF 없음
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-destructive ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-muted/30 rounded-lg overflow-hidden ${className}`}>
      {/* 툴바 */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm tabular-nums">
          {pageNumber} / {numPages || "-"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight size={16} />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
        >
          <ZoomOut size={16} />
        </Button>
        <span className="text-xs text-muted-foreground">{(scale * 100).toFixed(0)}%</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale((s) => Math.min(2, s + 0.25))}
        >
          <ZoomIn size={16} />
        </Button>
      </div>

      {/* PDF */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Loading PDF...
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}
