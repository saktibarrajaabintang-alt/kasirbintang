import { NextResponse } from "next/server";
import { verifyPassword, type SessionUser } from "@/lib/auth";
import { loadDatabaseState } from "@/lib/database";
import { createSignedSessionCookieValue } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  if (
    !credentials ||
    typeof credentials !== "object" ||
    !("username" in credentials) ||
    !("password" in credentials) ||
    typeof credentials.username !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }

  try {
    const state = await loadDatabaseState();
    const username = credentials.username.trim();
    const user = state.users.find((candidate) => candidate.username === username);
    if (!user || !verifyPassword(credentials.password, user.passwordHash)) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }

    const session: SessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };
    const cookieValue = await createSignedSessionCookieValue(session);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("pos_session", cookieValue, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Gagal memproses login:", error);
    return NextResponse.json({ error: "Login tidak dapat diproses." }, { status: 500 });
  }
}
