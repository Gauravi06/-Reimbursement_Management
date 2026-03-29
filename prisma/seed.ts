import { PrismaClient, Role, ExpenseStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: "demo_org" },
    update: {},
    create: { clerkOrgId: "demo_org", name: "Acme Corp" },
  });

  const employee = await prisma.user.upsert({
    where: { clerkUserId: "demo_employee" },
    update: {},
    create: {
      clerkUserId: "demo_employee",
      email: "employee@acme.com",
      firstName: "Sarah",
      lastName: "Chen",
      role: Role.EMPLOYEE,
      orgId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { clerkUserId: "demo_manager" },
    update: {},
    create: {
      clerkUserId: "demo_manager",
      email: "manager@acme.com",
      firstName: "Marcus",
      lastName: "Johnson",
      role: Role.MANAGER,
      orgId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { clerkUserId: "demo_finance" },
    update: {},
    create: {
      clerkUserId: "demo_finance",
      email: "finance@acme.com",
      firstName: "Finance",
      lastName: "Lead",
      role: Role.FINANCE,
      orgId: org.id,
    },
  });

  // Create approval rule with steps
  const existingRule = await prisma.approvalRule.findFirst({ where: { orgId: org.id } });
  if (!existingRule) {
    await prisma.approvalRule.create({
      data: {
        orgId: org.id,
        thresholdPercent: 60,
        overrideRole: Role.CFO,
        steps: {
          create: [
            { order: 0, role: Role.MANAGER, type: "SEQUENTIAL", slaDays: 2 },
            { order: 1, role: Role.FINANCE, type: "SEQUENTIAL", slaDays: 1 },
            { order: 2, role: Role.DIRECTOR, type: "SEQUENTIAL", slaDays: 3 },
          ],
        },
      },
    });
  }

  // Sample expenses
  await prisma.expense.createMany({
    data: [
      {
        merchant: "Delta Airlines",
        date: new Date("2024-01-15"),
        totalAmount: 2840,
        currency: "USD",
        category: "Travel",
        description: "Q1 sales conference flights",
        status: ExpenseStatus.PENDING,
        currentStep: 0,
        submittedById: employee.id,
        orgId: org.id,
      },
      {
        merchant: "Figma Inc.",
        date: new Date("2024-01-13"),
        totalAmount: 1200,
        currency: "USD",
        category: "Software",
        description: "Annual Figma license",
        status: ExpenseStatus.APPROVED,
        currentStep: 3,
        submittedById: employee.id,
        orgId: org.id,
      },
      {
        merchant: "WeWork",
        date: new Date("2024-01-10"),
        totalAmount: 500,
        currency: "USD",
        category: "Office",
        description: "Co-working space January",
        status: ExpenseStatus.REJECTED,
        currentStep: 1,
        submittedById: employee.id,
        orgId: org.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
