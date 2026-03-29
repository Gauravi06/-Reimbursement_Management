export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): Response {
  console.error(error);
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
