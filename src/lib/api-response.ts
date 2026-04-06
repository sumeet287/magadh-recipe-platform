// ==================== API Response Helpers ====================
import { NextResponse } from "next/server";

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: ApiSuccessResponse["meta"]
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  if (meta) response.meta = meta;
  return response;
}

export function errorResponse(
  error: string,
  code?: string,
  details?: unknown
): ApiErrorResponse {
  const response: ApiErrorResponse = { success: false, error };
  if (code) response.code = code;
  if (details !== undefined) response.details = details;
  return response;
}

export function paginatedMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    meta: paginatedMeta(total, page, limit),
  });
}
