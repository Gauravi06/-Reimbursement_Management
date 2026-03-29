import { NextRequest } from "next/server";
import { requireRole, getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { ApprovalRulePayload } from "@/types";
import { Role, ApprovalType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getDbUser();
    const rules = await prisma.approvalRule.findMany({
      where: { orgId: user.orgId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    return Response.json(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN, Role.MANAGER]);
    const body: ApprovalRulePayload = await req.json();

    await prisma.approvalRule.deleteMany({ where: { orgId: user.orgId } });

    const rule = await prisma.approvalRule.create({
      data: {
        orgId: user.orgId,
        thresholdPercent: body.thresholdPercent,
        overrideRole: body.overrideRole as Role,
        steps: {
          create: body.steps.map((s) => ({
            order: s.order,
            role: s.role as Role,
            type: s.type as ApprovalType,
            slaDays: s.slaDays,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return Response.json(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
