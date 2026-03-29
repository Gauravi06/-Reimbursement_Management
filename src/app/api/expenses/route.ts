import { NextRequest } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExpensesByOrg } from "@/lib/db-helpers";
import { handleApiError } from "@/lib/errors";
import { CreateExpensePayload } from "@/types";
import { ExpenseStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ExpenseStatus | null;

    const expenses = await getExpensesByOrg(user.orgId, status ?? undefined);

    const filtered =
      user.role === "EMPLOYEE"
        ? expenses.filter((e) => e.submittedById === user.id)
        : expenses;

    return Response.json(filtered);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    const body: CreateExpensePayload = await req.json();

    const expense = await prisma.expense.create({
      data: {
        merchant: body.merchant,
        date: new Date(body.date),
        totalAmount: body.totalAmount,
        currency: body.currency ?? "USD",
        category: body.category,
        description: body.description,
        notes: body.notes,
        status: ExpenseStatus.PENDING,
        currentStep: 0,
        submittedById: user.id,
        orgId: user.orgId,
        lineItems: {
          create: body.lineItems.map((li) => ({
            description: li.description,
            amount: li.amount,
            order: li.order,
          })),
        },
      },
      include: { lineItems: true },
    });

    return Response.json(expense, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
