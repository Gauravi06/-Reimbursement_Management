"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptUploader } from "@/components/expenses/receipt-uploader";
import { EXPENSE_CATEGORIES, CURRENCIES } from "@/types";

interface LineItem {
  description: string;
  amount: string;
  order: number;
}

export default function NewExpensePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    merchant: "",
    date: new Date().toISOString().split("T")[0],
    totalAmount: "",
    currency: "USD",
    category: "",
    description: "",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", amount: "", order: 0 },
  ]);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Called when OCR extracts data from the receipt
  function handleOcrComplete(fields: { merchant: string; amount: string; date: string }) {
    setForm((f) => ({
      ...f,
      ...(fields.merchant ? { merchant: fields.merchant } : {}),
      ...(fields.amount ? { totalAmount: fields.amount } : {}),
      ...(fields.date ? { date: (() => {
        try {
          const d = new Date(fields.date);
          return isNaN(d.getTime()) ? f.date : d.toISOString().split("T")[0];
        } catch { return f.date; }
      })() } : {}),
    }));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { description: "", amount: "", order: items.length }]);
  }

  function removeLineItem(idx: number) {
    setLineItems((items) => items.filter((_, i) => i !== idx).map((li, i) => ({ ...li, order: i })));
  }

  function updateLineItem(idx: number, key: keyof LineItem, value: string) {
    setLineItems((items) => items.map((li, i) => i === idx ? { ...li, [key]: value } : li));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.merchant || !form.totalAmount || !form.category) {
      setError("Please fill in merchant, amount, and category.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalAmount: parseFloat(form.totalAmount),
          lineItems: lineItems
            .filter((li) => li.description && li.amount)
            .map((li) => ({ ...li, amount: parseFloat(li.amount) })),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to submit");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Expense Submitted!</h2>
        <p className="text-muted-foreground text-sm">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submit Expense</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a receipt to auto-fill with OCR, or fill manually.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Receipt (Optional — OCR Auto-fill)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptUploader onOcrComplete={handleOcrComplete} />
          </CardContent>
        </Card>

        {/* Main fields */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="merchant">Merchant *</Label>
                <Input
                  id="merchant"
                  placeholder="e.g. Delta Airlines"
                  value={form.merchant}
                  onChange={(e) => setField("merchant", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount *</Label>
                <div className="flex gap-2">
                  <Select value={form.currency} onValueChange={(v) => setField("currency", v)}>
                    <SelectTrigger className="w-24 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.totalAmount}
                    onChange={(e) => setField("totalAmount", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the expense"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional context for approvers..."
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Line Items (Optional)
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => updateLineItem(idx, "amount", e.target.value)}
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              "Submit for Approval"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
