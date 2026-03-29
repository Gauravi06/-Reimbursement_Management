"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Check, X, ArrowRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/expenses/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExpenseStatus } from "@prisma/client";

interface Expense {
  id: string;
  merchant: string;
  totalAmount: number;
  currency: string;
  category: string;
  date: string;
  status: ExpenseStatus;
  currentStep: number;
  submittedBy: { firstName: string; lastName: string; email: string };
}

type ActionType = "approve" | "reject";

const columnHelper = createColumnHelper<Expense>();

export default function ApprovalsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: ActionType;
    expenseId: string;
    merchant: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/expenses${qs}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  async function handleAction() {
    if (!actionDialog) return;
    setActioning(true);
    setActionError(null);

    try {
      const endpoint = `/api/expenses/${actionDialog.expenseId}/${actionDialog.type}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Action failed");
      }

      setActionDialog(null);
      setNote("");
      fetchExpenses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    } finally {
      setActioning(false);
    }
  }

  const columns = [
    columnHelper.accessor((row) => `${row.submittedBy.firstName} ${row.submittedBy.lastName}`, {
      id: "employee",
      header: "EMPLOYEE",
      cell: (info) => (
        <div>
          <p className="text-sm font-medium text-foreground">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.submittedBy.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("merchant", {
      header: "MERCHANT",
      cell: (info) => <span className="text-sm text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("totalAmount", {
      header: "AMOUNT",
      cell: (info) => (
        <span className="text-sm font-semibold text-foreground">
          {info.row.original.currency} {Number(info.getValue()).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("category", {
      header: "CATEGORY",
      cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("date", {
      header: "DATE",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "STATUS",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {row.original.status === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() =>
                  setActionDialog({
                    open: true,
                    type: "approve",
                    expenseId: row.original.id,
                    merchant: row.original.merchant,
                  })
                }
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() =>
                  setActionDialog({
                    open: true,
                    type: "reject",
                    expenseId: row.original.id,
                    merchant: row.original.merchant,
                  })
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground" asChild>
            <Link href={`/expenses/${row.original.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: expenses,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const statusTabs = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and action expense requests</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Status tabs */}
            <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search merchant..."
                className="pl-8 h-8 w-52 text-sm"
                onChange={(e) =>
                  table.getColumn("merchant")?.setFilterValue(e.target.value)
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">No expenses found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left text-xs font-medium text-muted-foreground px-6 py-3"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) { setActionDialog(null); setNote(""); setActionError(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" ? "✅ Approve" : "❌ Reject"} Expense
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.type === "approve"
                ? `Approve "${actionDialog.merchant}"?`
                : `Reject "${actionDialog?.merchant}"? This cannot be undone.`}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="note">
                Note {actionDialog?.type === "reject" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="note"
                placeholder={
                  actionDialog?.type === "approve"
                    ? "Optional comment..."
                    : "Reason for rejection (required)"
                }
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {actionError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                {actionError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setActionDialog(null); setNote(""); setActionError(null); }}
              disabled={actioning}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog?.type === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actioning || (actionDialog?.type === "reject" && !note.trim())}
            >
              {actioning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : actionDialog?.type === "approve" ? (
                "Confirm Approve"
              ) : (
                "Confirm Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
