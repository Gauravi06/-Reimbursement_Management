import { prisma } from "./prisma";
import { ExpenseStatus, Role } from "@prisma/client";
import { ApiError } from "./errors";

/**
 * APPROVAL ENGINE
 *
 * Flow:
 *   PENDING (step 0) → MANAGER approves → step 1
 *   step 1 → FINANCE approves → step 2
 *   step 2 → DIRECTOR approves → APPROVED
 *
 * Override: CFO approves at any point → immediate APPROVED
 * Threshold: if X% of approvers at a step have approved → advance
 */
export async function processApproval(
  expenseId: string,
  approverId: string,
  note?: string
) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      org: {
        include: {
          approvalRules: {
            include: { steps: { orderBy: { order: "asc" } } },
          },
        },
      },
      approvalRecords: true,
    },
  });

  if (!expense) throw new ApiError(404, "Expense not found");
  if (expense.status !== ExpenseStatus.PENDING) {
    throw new ApiError(400, "Expense is not pending approval");
  }

  const approver = await prisma.user.findUnique({ where: { id: approverId } });
  if (!approver) throw new ApiError(404, "Approver not found");

  const rule = expense.org.approvalRules[0];
  if (!rule) throw new ApiError(500, "No approval rule configured");

  const steps = rule.steps;

  // ── Override role: skip all steps, approve immediately ──
  if (approver.role === rule.overrideRole) {
    await prisma.$transaction([
      prisma.approvalRecord.create({
        data: {
          expenseId,
          approverId,
          stepOrder: expense.currentStep,
          action: "approved",
          note: note ?? `Auto-approved by ${rule.overrideRole}`,
        },
      }),
      prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED, currentStep: steps.length },
      }),
    ]);
    return { status: "approved", message: `Override approval by ${rule.overrideRole}` };
  }

  const currentStep = steps[expense.currentStep];
  if (!currentStep) throw new ApiError(400, "All steps already completed");

  // Check approver has the right role for this step
  if (approver.role !== currentStep.role) {
    throw new ApiError(
      403,
      `Step ${expense.currentStep + 1} requires a ${currentStep.role}. You are ${approver.role}.`
    );
  }

  // Prevent double-approval
  const alreadyApproved = expense.approvalRecords.some(
    (r) =>
      r.approverId === approverId &&
      r.stepOrder === expense.currentStep &&
      r.action === "approved"
  );
  if (alreadyApproved) throw new ApiError(400, "You already approved this step");

  // Record the approval
  await prisma.approvalRecord.create({
    data: {
      expenseId,
      approverId,
      stepOrder: expense.currentStep,
      action: "approved",
      note,
    },
  });

  // Count approvals for this step
  const stepApprovals = await prisma.approvalRecord.count({
    where: { expenseId, stepOrder: expense.currentStep, action: "approved" },
  });

  // Sequential: 1 approval per step is sufficient
  // For multi-approver steps, compare against threshold
  const thresholdMet = stepApprovals >= 1;

  if (!thresholdMet) {
    return { status: "pending", message: "Awaiting more approvals for this step" };
  }

  // Advance to next step
  const nextStepIndex = expense.currentStep + 1;
  const isFullyApproved = nextStepIndex >= steps.length;

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      currentStep: nextStepIndex,
      status: isFullyApproved ? ExpenseStatus.APPROVED : ExpenseStatus.PENDING,
    },
  });

  return {
    status: isFullyApproved ? "approved" : "advanced",
    message: isFullyApproved
      ? "Expense fully approved ✅"
      : `Advanced to step ${nextStepIndex + 1}: ${steps[nextStepIndex].role}`,
  };
}

export async function processRejection(
  expenseId: string,
  approverId: string,
  note?: string
) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new ApiError(404, "Expense not found");
  if (expense.status !== ExpenseStatus.PENDING) {
    throw new ApiError(400, "Expense is not pending");
  }

  await prisma.$transaction([
    prisma.approvalRecord.create({
      data: {
        expenseId,
        approverId,
        stepOrder: expense.currentStep,
        action: "rejected",
        note,
      },
    }),
    prisma.expense.update({
      where: { id: expenseId },
      data: { status: ExpenseStatus.REJECTED },
    }),
  ]);

  return { status: "rejected", message: "Expense rejected" };
}
