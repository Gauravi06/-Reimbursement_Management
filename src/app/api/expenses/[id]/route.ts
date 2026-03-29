import { NextRequest } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExpenseById } from "@/lib/db-helpers";
import { handleApiError, ApiError } from "@/lib/errors";
import { UpdateExpensePayload } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    const { id } = await params;
    const expense = await getExpenseById(id, user.orgId);
    if (!expense) throw new ApiError(404, "Expense not found");
    return Response.json(expense);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    const { id } = await params;
    const body: UpdateExpensePayload = await req.json();

    const expense = await prisma.expense.findFirst({ where: { id, orgId: user.orgId } });
    if (!expense) throw new ApiError(404, "Expense not found");

    if (expense.submittedById !== user.id && user.role !== "ADMIN") {
      throw new ApiError(403, "Cannot edit this expense");
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(body.merchant && { merchant: body.merchant }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.totalAmount && { totalAmount: body.totalAmount }),
        ...(body.currency && { currency: body.currency }),
        ...(body.category && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
