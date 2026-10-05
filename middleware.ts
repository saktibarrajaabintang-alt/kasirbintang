import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionCookieValue } from "@/lib/auth";

const protectedPaths = [
  "/dashboard",
  "/produk",
  "/stok",
  "/member",
  "/transaksi",
  "/laporan",
  "/kasir",
  "/karyawan",
  "/pengaturan",
];

const adminOnlyPaths = [
  "/produk",
  "/stok",
  "/laporan",
  "/kasir",
  "/karyawan",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("pos_session")?.value;
  const sessionUser = parseSessionCookieValue(sessionCookie);

  if (pathname === "/login") {
    if (sessionUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (sessionUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!sessionUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminOnly = adminOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isAdminOnly && sessionUser.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/produk/:path*", "/stok/:path*", "/member/:path*", "/transaksi/:path*", "/laporan/:path*", "/kasir/:path*", "/karyawan/:path*", "/pengaturan/:path*"],
};
