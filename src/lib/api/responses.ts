import { NextResponse } from "next/server";

export type ApiErrorCode =
  "BAD_REQUEST" | "FORBIDDEN" | "INTERNAL" | "NOT_FOUND" | "UNAVAILABLE";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function apiOk<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ data, ok: true }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error:
        details === undefined ? { code, message } : { code, details, message },
      ok: false,
    },
    { status },
  );
}

export function apiUnhandledError(): NextResponse<ApiErrorBody> {
  return apiError("INTERNAL", "Unexpected server error.", 500);
}
