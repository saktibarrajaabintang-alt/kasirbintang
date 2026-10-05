import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignedSessionCookieValue } from "@/lib/session";

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
  "/api/state",
];

const adminOnlyPaths = [
  "/produk",
  "/stok",
  "/laporan",
  "/kasir",
  "/karyawan",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("pos_session")?.value;
  let sessionUser;
  try {
    sessionUser = await verifySignedSessionCookieValue(sessionCookie);
  } catch (error) {
    console.error("Gagal memvalidasi session:", error);
    return NextResponse.json({ error: "Konfigurasi session belum valid." }, { status: 500 });
  }

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
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminOnly = adminOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isAdminOnly && sessionUser.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/produk/:path*", "/stok/:path*", "/member/:path*", "/transaksi/:path*", "/laporan/:path*", "/kasir/:path*", "/karyawan/:path*", "/pengaturan/:path*", "/api/state"],
};
