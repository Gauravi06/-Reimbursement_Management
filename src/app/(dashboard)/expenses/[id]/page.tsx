import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/expenses/status-badge";
import { ApprovalProgress } from "@/components/expenses/approval-progress";
import { ArrowLeft, Calendar, Tag, DollarSign, FileText } from "lucide-react";

async function getExpenseDetail(expenseId: string, clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId }, include: { org: true } });
  if (!user) return null;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, orgId: user.orgId },
    include: {
      submittedBy: { select: { firstName: true, lastName: true, email: true, role: true } },
      lineItems: { orderBy: { order: "asc" } },
      approvalRecords: {
        include: { approver: { select: { firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const rule = await prisma.approvalRule.findFirst({
    where: { orgId: user.orgId },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  return { user, expense, steps: rule?.steps ?? [] };
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const data = await getExpenseDetail(id, userId);
  if (!data || !data.expense) notFound();

  const { user, expense, steps } = data;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{expense.merchant}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submitted by {expense.submittedBy.firstName} {expense.submittedBy.lastName}
          </p>
        </div>
        <StatusBadge status={expense.status} />
      </div>

      {/* Details */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-semibold text-foreground">
                {expense.currency} {Number(expense.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-semibold text-foreground">{expense.category}</p>
            </div>
          </div>
          {expense.description && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm font-semibold text-foreground">{expense.description}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Progress */}
      {steps.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Approval Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ApprovalProgress
              steps={steps.map((s) => ({
                order: s.order,
                role: s.role,
                slaDays: s.slaDays,
              }))}
              records={expense.approvalRecords.map((r) => ({
                stepOrder: r.stepOrder,
                action: r.action,
                approver: r.approver,
                createdAt: r.createdAt.toISOString(),
                note: r.note,
              }))}
              currentStep={expense.currentStep}
              status={expense.status}
            />
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      {expense.lineItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Line Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground px-6 py-2">Description</th>
                  <th className="text-right text-xs text-muted-foreground px-6 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expense.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-border/50">
                    <td className="px-6 py-3 text-sm">{li.description}</td>
                    <td className="px-6 py-3 text-sm text-right font-medium">
                      ${Number(li.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {expense.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{expense.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval History */}
      {expense.approvalRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Approval History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expense.approvalRecords.map((record) => (
              <div key={record.id} className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  record.action === "approved" ? "bg-emerald-500" : "bg-red-500"
                }`} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {record.approver.firstName} {record.approver.lastName}
                    <span className={`ml-2 text-xs font-semibold ${
                      record.action === "approved" ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {record.action.toUpperCase()}
                    </span>
                  </p>
                  {record.note && (
                    <p className="text-xs text-muted-foreground mt-0.5">{record.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {record.stepOrder + 1} · {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
