import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { db } from "./db"

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key_change_this_in_production"
)

export type UserRole = "ADMIN" | "USER" | "GUEST"

export interface AuthPayload {
  id: string
  username: string
  role: UserRole
  [key: string]: string // Add index signature for JWT compatibility
}

export async function signToken(payload: AuthPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey)

  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400, // 24 hours
  })

  return token
}

export async function verifyAuth(request?: NextRequest) {
  const token = request 
    ? request.cookies.get("token")
    : cookies().get("token")

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token.value, secretKey)
    return verified.payload as AuthPayload
  } catch (err) {
    return null
  }
}

export async function getCurrentUser() {
  const token = cookies().get("token")

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token.value, secretKey)
    const payload = verified.payload as AuthPayload
    
    const database = db()
    const user = database.prepare(`
      SELECT id, username, email, role
      FROM users
      WHERE id = ?
    `).get(payload.id)

    return user
  } catch {
    return null
  }
}