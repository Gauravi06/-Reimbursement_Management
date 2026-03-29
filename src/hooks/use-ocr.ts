"use client";

import { useState, useCallback } from "react";

interface OcrResult {
  merchant: string;
  amount: string;
  date: string;
  rawText: string;
}

interface UseOcrReturn {
  scanning: boolean;
  progress: number;
  result: OcrResult | null;
  error: string | null;
  scanReceipt: (file: File) => Promise<OcrResult | null>;
  reset: () => void;
}

/**
 * Parses raw OCR text to extract merchant, amount, and date.
 * This is heuristic-based — good enough for a hackathon MVP.
 */
function parseReceiptText(text: string): OcrResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // ── Amount: find largest dollar figure ──
  const amountMatches = text.match(/\$?\d{1,6}[.,]\d{2}/g) ?? [];
  const amounts = amountMatches
    .map((a) => parseFloat(a.replace(/[$,]/g, "")))
    .filter((a) => a > 0);
  const amount = amounts.length > 0 ? Math.max(...amounts).toFixed(2) : "";

  // ── Date: common formats ──
  const dateRegexes = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b/,
  ];
  let date = "";
  for (const re of dateRegexes) {
    const match = text.match(re);
    if (match) { date = match[0]; break; }
  }

  // ── Merchant: first non-trivial line (skip single chars and common receipt headers) ──
  const skipWords = /^(receipt|invoice|bill|tax|total|subtotal|amount|date|time|thank|welcome|cashier|order|table)/i;
  const merchant =
    lines.find((l) => l.length > 3 && !skipWords.test(l) && !/^\d+$/.test(l)) ?? "";

  return { merchant, amount, date, rawText: text };
}

export function useOcr(): UseOcrReturn {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanReceipt = useCallback(async (file: File): Promise<OcrResult | null> => {
    setScanning(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Dynamically import tesseract to avoid SSR issues
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(file);

      await worker.terminate();

      const parsed = parseReceiptText(text);
      setResult(parsed);
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR failed";
      setError(msg);
      return null;
    } finally {
      setScanning(false);
      setProgress(100);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setScanning(false);
  }, []);

  return { scanning, progress, result, error, scanReceipt, reset };
}
