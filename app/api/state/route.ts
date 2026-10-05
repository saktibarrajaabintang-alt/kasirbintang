import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createSeedData } from "@/lib/store";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

const stateFile = path.join(process.cwd(), ".data", "app-state.json");

const readState = async (): Promise<AppState> => {
  try {
    return JSON.parse(await readFile(stateFile, "utf8")) as AppState;
  } catch {
    return createSeedData();
  }
};

export async function GET() {
  return NextResponse.json(await readState());
}

export async function POST(request: Request) {
  const state = (await request.json()) as AppState;
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}
