import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/expenses/status-badge";
import {
  PlusCircle,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

/* ------------------ FAKE DATA ------------------ */

const user = {
  firstName: "Demo",
  role: "EMPLOYEE",
  org: { name: "Acme Corp" },
};

const expenses = [
  {
    id: "1",
    merchant: "Uber",
    category: "Travel",
    totalAmount: 450,
    currency: "₹",
    date: new Date(),
    status: "PENDING",
    submittedBy: { firstName: "Demo", lastName: "User" },
  },
  {
    id: "2",
    merchant: "Starbucks",
    category: "Food",
    totalAmount: 300,
    currency: "₹",
    date: new Date(),
    status: "APPROVED",
    submittedBy: { firstName: "Demo", lastName: "User" },
  },
  {
    id: "3",
    merchant: "Amazon",
    category: "Office",
    totalAmount: 1200,
    currency: "₹",
    date: new Date(),
    status: "REJECTED",
    submittedBy: { firstName: "Demo", lastName: "User" },
  },
];

/* ------------------ STATS ------------------ */

const pendingCount = expenses.filter(e => e.status === "PENDING").length;
const approvedCount = expenses.filter(e => e.status === "APPROVED").length;
const rejectedCount = expenses.filter(e => e.status === "REJECTED").length;

const totalAmount = expenses
  .filter(e => e.status === "APPROVED")
  .reduce((sum, e) => sum + e.totalAmount, 0);

/* ------------------ PAGE ------------------ */

export default function DashboardPage() {
  const stats = [
    {
      label: "Pending Review",
      value: pendingCount,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Approved",
      value: approvedCount,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Total Approved (₹)",
      value: `₹${totalAmount.toLocaleString()}`,
      icon: Receipt,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user.org.name} ·{" "}
            
          </p>
        </div>
        <Button asChild>
          <Link href="#">
            <PlusCircle className="h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {label}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>
                    {value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>

        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2">Merchant</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-left px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="px-4 py-2">{e.merchant}</td>
                  <td className="px-4 py-2">{e.category}</td>
                  <td className="px-4 py-2">
                    {e.currency} {e.totalAmount}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={e.status as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}