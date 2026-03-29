import { getDbUser } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getDbUser();
    return Response.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
