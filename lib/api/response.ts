import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function ok<T>(data: T, init?: ResponseInit) {
  const requestId = randomUUID();
  return NextResponse.json({ data, error: null, requestId }, { ...init, headers: { 'X-Request-Id': requestId } });
}

export function fail(code: string, message: string, status = 400) {
  const requestId = randomUUID();
  return NextResponse.json({ data: null, error: { code, message }, requestId }, { status });
}
