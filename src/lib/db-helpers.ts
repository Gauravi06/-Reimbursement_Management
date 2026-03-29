import { prisma } from "./prisma";
import { ExpenseStatus } from "@prisma/client";

export async function getExpensesByOrg(orgId: string, status?: ExpenseStatus) {
  return prisma.expense.findMany({
    where: { orgId, ...(status ? { status } : {}) },
    include: {
      submittedBy: {
        select: { firstName: true, lastName: true, email: true, role: true },
      },
      lineItems: { orderBy: { order: "asc" } },
      approvalRecords: {
        include: {
          approver: { select: { firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExpenseById(id: string, orgId: string) {
  return prisma.expense.findFirst({
    where: { id, orgId },
    include: {
      submittedBy: {
        select: { firstName: true, lastName: true, email: true, role: true },
      },
      lineItems: { orderBy: { order: "asc" } },
      approvalRecords: {
        include: {
          approver: { select: { firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getApprovalRuleByOrg(orgId: string) {
  return prisma.approvalRule.findFirst({
    where: { orgId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}
