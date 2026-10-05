import type { SessionUser } from "@/lib/auth";

interface SignedSessionPayload extends SessionUser {
  exp: number;
}

const encodeBase64Url = (value: Uint8Array): string =>
  btoa(String.fromCharCode(...value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getSigningKey = async (): Promise<CryptoKey> => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET harus diatur dan minimal 32 karakter.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
};

const sign = async (payload: string): Promise<string> => {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return encodeBase64Url(new Uint8Array(signature));
};

const parsePayload = (payload: string): SignedSessionPayload | null => {
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object") return null;

    const user = parsed as Partial<SignedSessionPayload>;
    if (
      typeof user.id !== "string" ||
      typeof user.name !== "string" ||
      typeof user.username !== "string" ||
      typeof user.exp !== "number" ||
      (user.role !== "ADMIN" && user.role !== "KASIR")
    ) {
      return null;
    }
    return user as SignedSessionPayload;
  } catch {
    return null;
  }
};

export const createSignedSessionCookieValue = async (user: SessionUser): Promise<string> => {
  const signedPayload: SignedSessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(signedPayload)));
  return `${payload}.${await sign(payload)}`;
};

export const verifySignedSessionCookieValue = async (
  value: string | undefined,
): Promise<SessionUser | null> => {
  if (!value) return null;

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expectedSignature = await sign(payload);
  if (signature.length !== expectedSignature.length) return null;

  let difference = 0;
  for (let index = 0; index < signature.length; index += 1) {
    difference |= signature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  if (difference !== 0) return null;

  const parsed = parsePayload(payload);
  if (!parsed || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
  return {
    id: parsed.id,
    name: parsed.name,
    username: parsed.username,
    role: parsed.role,
  };
};
