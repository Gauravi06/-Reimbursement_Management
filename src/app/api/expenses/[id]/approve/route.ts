import { NextRequest } from "next/server";
import { getDbUser } from "@/lib/auth";
import { processApproval } from "@/lib/approval-engine";
import { handleApiError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    const { id } = await params;
    const { note } = await req.json();
    const result = await processApproval(id, user.id, note);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
