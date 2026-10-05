import { NextResponse } from "next/server";
import { loadDatabaseState, saveDatabaseState } from "@/lib/database";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

const isAppState = (value: unknown): value is AppState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AppState>;
  return (
    Array.isArray(state.users) &&
    Array.isArray(state.products) &&
    Array.isArray(state.members) &&
    Array.isArray(state.transactions)
  );
};

export async function GET() {
  try {
    return NextResponse.json(await loadDatabaseState());
  } catch (error) {
    console.error("Gagal membaca state dari MySQL:", error);
    return NextResponse.json({ error: "Database tidak dapat diakses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let state: unknown;
  try {
    state = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  if (!isAppState(state)) {
    return NextResponse.json({ error: "Format state aplikasi tidak valid." }, { status: 400 });
  }

  try {
    await saveDatabaseState(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal menyimpan state ke MySQL:", error);
    return NextResponse.json({ error: "Database tidak dapat diakses." }, { status: 500 });
  }
}
