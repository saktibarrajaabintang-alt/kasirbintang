import bcrypt from "bcryptjs";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "KASIR";
}

const encodeBase64Url = (value: string): string => {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(value)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(value, "utf-8").toString("base64url");
};

const decodeBase64Url = (value: string): string => {
  if (typeof window !== "undefined") {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  }

  return Buffer.from(value, "base64url").toString("utf-8");
};

export const hashPassword = (value: string): string => bcrypt.hashSync(value, 10);

export const verifyPassword = (value: string, hash: string): boolean =>
  bcrypt.compareSync(value, hash);

export const createSessionCookieValue = (user: SessionUser): string =>
  encodeBase64Url(JSON.stringify(user));

export const parseSessionCookieValue = (value: string | undefined): SessionUser | null => {
  if (!value) return null;

  try {
    const json = decodeBase64Url(value);
    const parsed = JSON.parse(json) as SessionUser;
    if (!parsed.id || !parsed.username || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "pos_session=; path=/; max-age=0; samesite=lax";
};
