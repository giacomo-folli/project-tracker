// This file is no longer needed as we've consolidated middleware in the root middleware.ts
// Keeping this file to avoid breaking imports, but it's not used

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [],
};
