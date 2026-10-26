import { NextResponse } from "next/server";

/**
 * Standard API error response
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard API success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Verify admin token
 */
export function verifyAdminToken(headers: Headers): boolean {
  const token = headers.get("x-admin-token");
  const expectedToken = process.env.CHAIN_ADMIN_TOKEN;

  if (!expectedToken) {
    console.warn("CHAIN_ADMIN_TOKEN not configured");
    return false;
  }

  return token === expectedToken;
}

/**
 * Parse pagination params from URL
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "50", 10),
    200
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Format MongoDB ObjectId as string
 */
export function formatObjectId(id: any): string {
  if (!id) return "";
  return id.toString();
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
