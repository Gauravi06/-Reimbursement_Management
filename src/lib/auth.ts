// DEMO MODE (no Clerk, no Prisma dependency)

export async function getDbUser() {
  return {
    id: "demo-user",
    clerkUserId: "demo-user",
    firstName: "Aditya",
    lastName: "Sharma",
    role: "ADMIN",
    orgId: "demo-org",
    org: {
      id: "demo-org",
      name: "Demo Company",
    },
  };
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getDbUser();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}