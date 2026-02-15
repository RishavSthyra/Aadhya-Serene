import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: ['/__disabled_middleware__'] };
