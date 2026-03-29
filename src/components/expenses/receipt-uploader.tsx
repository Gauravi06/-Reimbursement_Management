"use client";

import { useRef, useState } from "react";
import { Upload, ScanLine, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOcr } from "@/hooks/use-ocr";

interface OcrFields {
  merchant: string;
  amount: string;
  date: string;
}

interface ReceiptUploaderProps {
  onOcrComplete: (fields: OcrFields) => void;
}

export function ReceiptUploader({ onOcrComplete }: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { scanning, progress, result, error, scanReceipt, reset } = useOcr();

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleScan() {
    if (!file) return;
    const res = await scanReceipt(file);
    if (res) {
      onOcrComplete({
        merchant: res.merchant,
        amount: res.amount,
        date: res.date,
      });
    }
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {!file ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Drop receipt here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Preview */}
          <div className="relative bg-muted/30 flex items-center justify-center p-4 min-h-[140px]">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Receipt" className="max-h-48 object-contain rounded" />
            )}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* File info + scan button */}
          <div className="p-3 flex items-center gap-3 border-t border-border">
            <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground flex-1 truncate">{file.name}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleScan}
              disabled={scanning}
              className="shrink-0 gap-1.5"
            >
              <ScanLine className="h-3.5 w-3.5" />
              {scanning ? `${progress}%` : "Scan OCR"}
            </Button>
          </div>

          {/* Progress bar */}
          {scanning && (
            <div className="h-1 bg-border">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* OCR result preview */}
      {result && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-emerald-400 mb-2">✅ OCR extracted — fields auto-filled</p>
          {result.merchant && (
            <p className="text-xs text-muted-foreground">Merchant: <span className="text-foreground">{result.merchant}</span></p>
          )}
          {result.amount && (
            <p className="text-xs text-muted-foreground">Amount: <span className="text-foreground">${result.amount}</span></p>
          )}
          {result.date && (
            <p className="text-xs text-muted-foreground">Date: <span className="text-foreground">{result.date}</span></p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">OCR failed: {error}. Please fill fields manually.</p>
      )}
    </div>
  );
}
