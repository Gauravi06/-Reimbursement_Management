import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return Response.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { clerkOrgId: "default", name: "My Organization" },
      });
    }

    await prisma.user.upsert({
      where: { clerkUserId: id },
      update: { email, firstName: first_name ?? "", lastName: last_name ?? "" },
      create: {
        clerkUserId: id,
        email,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        role: Role.EMPLOYEE,
        orgId: org.id,
      },
    });
  }

  return Response.json({ received: true });
}
