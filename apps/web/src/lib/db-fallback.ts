import { Prisma } from "@ember-grain/db";

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P2024", "P1001", "P1017"].includes(error.code);
  }

  if (error instanceof Error) {
    return /(timed out fetching a new connection|connection pool|timeout|ECONNRESET|ECONNREFUSED)/i.test(
      error.message,
    );
  }

  return false;
}

export async function withDatabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context = "database query",
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.error(`[${context}] database unavailable, returning fallback.`);
      return fallback;
    }

    throw error;
  }
}
