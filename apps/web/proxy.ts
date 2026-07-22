import { NextRequest, NextResponse } from "next/server";

const REALM = "Xtar";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export function proxy(request: NextRequest) {
  const user = process.env.PERIMETER_AUTH_USER;
  const pass = process.env.PERIMETER_AUTH_PASSWORD;

  if (!user || !pass) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString();
  const [suppliedUser, suppliedPass] = decoded.split(":");

  if (suppliedUser !== user || suppliedPass !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
