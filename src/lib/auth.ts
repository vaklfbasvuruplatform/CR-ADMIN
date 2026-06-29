import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface AuthPayload {
  username: string;
  iat: number;
  exp: number;
}

export function createToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Simple in-memory admin password management (fallback)
// Ideally this should use the database 'admins' table
let adminPassword = "admin123";

export function getAdminPassword() {
  return adminPassword;
}

export function updateAdminPassword(newPassword: string) {
  adminPassword = newPassword;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
