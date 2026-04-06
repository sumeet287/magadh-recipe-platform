import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", public details?: unknown) {
    super(message, 422, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      errorResponse(error.message, error.code),
      { status: error.statusCode }
    );
  }

  // Prisma duplicate key
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return NextResponse.json(
      errorResponse("Already exists", "DUPLICATE"),
      { status: 409 }
    );
  }

  console.error("[API Error]", error);
  return NextResponse.json(
    errorResponse("Internal server error", "INTERNAL_ERROR"),
    { status: 500 }
  );
}
