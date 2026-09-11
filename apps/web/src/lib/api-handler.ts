import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@ember-grain/db";
import { apiError, type ApiResult } from "@ember-grain/shared";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Sign in required.") {
    super(401, "UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You don't have access to this resource.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Invalid request.", details?: unknown) {
    super(422, "VALIDATION_ERROR", message, details);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "The request conflicts with existing data.") {
    super(409, "CONFLICT", message);
  }
}

/**
 * Wraps a Next.js route handler so every failure path returns a
 * consistent `ApiResult` envelope with the right status code. This is the
 * one place allowed to catch broadly — every catch here re-serializes into
 * a typed response rather than swallowing the error (AGENTS.md §4).
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse<ApiResult<unknown>>>,
) {
  return async (...args: Args): Promise<NextResponse<ApiResult<unknown>>> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json(apiError(err.code, err.message, err.details), {
          status: err.status,
        });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Invalid request payload.", err.flatten()),
          { status: 422 },
        );
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return NextResponse.json(
            apiError("CONFLICT", "A record with these details already exists."),
            { status: 409 },
          );
        }
        if (err.code === "P2025") {
          return NextResponse.json(
            apiError("NOT_FOUND", "The requested record was not found."),
            { status: 404 },
          );
        }
      }
      console.error("[unhandled_route_error]", err);
      return NextResponse.json(
        apiError("INTERNAL_ERROR", "Something went wrong. Please try again."),
        { status: 500 },
      );
    }
  };
}
