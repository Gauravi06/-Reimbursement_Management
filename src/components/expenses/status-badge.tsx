import { Badge } from "@/components/ui/badge";
import { ExpenseStatus } from "@prisma/client";

const statusConfig: Record<
  ExpenseStatus,
  { label: string; variant: "pending" | "success" | "destructive" | "secondary" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING: { label: "Pending", variant: "pending" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  const cfg = statusConfig[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
