import jwt from "jsonwebtoken";
import { env } from "../utils/env";
import prisma from "../prismaClient";
import { add } from "date-fns";
import { hash, compare } from "bcryptjs";
import { HttpError } from "../utils/httpError";

// Validate Prisma client is available
if (!prisma) {
  console.error("❌ CRITICAL: Prisma client not initialized. Check DATABASE_URL and Prisma setup.");
  process.exit(1);
}

function parseExpiryToDate(base: Date, expr: string) {
  const m = expr.match(/^(\d+)([smhd])$/i);
  if (!m) return add(base, { days: 30 });
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit === "s") return add(base, { seconds: n });
  if (unit === "m") return add(base, { minutes: n });
  if (unit === "h") return add(base, { hours: n });
  return add(base, { days: n });
}

// ------------------------------------
// ACCESS TOKEN
// ------------------------------------
export function signAccessToken(userId: string) {
  return jwt.sign({}, env.JWT_ACCESS_TOKEN_SECRET as jwt.Secret, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as any
  });
}

// ------------------------------------
// REFRESH TOKEN
// ------------------------------------
export function signRefreshToken(userId: string) {
  return jwt.sign({}, env.JWT_REFRESH_TOKEN_SECRET as jwt.Secret, {
    subject: userId,
    expiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN as any
  });
}

// ------------------------------------
// CREATE SESSION (stores hashed refresh token)
// ------------------------------------
export async function createSession(
  userId: string,
  refreshToken: string,
  _ip?: string | null,
  _userAgent?: string | null
) {
  try {
    if (!prisma) {
      throw new HttpError(500, "Database connection failed. Please try again.");
    }
    const tokenHash = await hash(refreshToken, 10);
    const expiresAt = parseExpiryToDate(new Date(), env.JWT_REFRESH_TOKEN_EXPIRES_IN);
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt
      }
    });
  } catch (error: any) {
    console.error("Error creating session:", error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to create session. Please try again.");
  }
}

export async function verifyAndRotateRefreshToken(oldToken: string) {
  try {
    if (!prisma) {
      throw new HttpError(500, "Database connection failed. Please try again.");
    }

    const payload = jwt.verify(oldToken, env.JWT_REFRESH_TOKEN_SECRET as jwt.Secret) as { sub: string };
    const userId = payload.sub;

    const tokens = await prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });

    let matchedId: string | null = null;
    for (const t of tokens) {
      const ok = await compare(oldToken, t.tokenHash);
      if (ok) {
        matchedId = t.id;
        break;
      }
    }

    if (!matchedId) throw new HttpError(401, "Session expired. Please sign in again.");

    await prisma.refreshToken.update({ where: { id: matchedId }, data: { revoked: true } });

    const newRefresh = signRefreshToken(userId);
    await createSession(userId, newRefresh);
    const accessToken = signAccessToken(userId);

    return { userId, accessToken, refreshToken: newRefresh };
  } catch (e: any) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Session expired. Please sign in again.");
  }
}

// ------------------------------------
// REGISTER LOCAL USER
// ------------------------------------
export async function registerLocalUser(
  email: string,
  password: string,
  name?: string
) {
  try {
    if (!prisma) {
      throw new HttpError(500, "Database connection failed. Please try again.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "Email already registered. Please sign in instead.");
    }

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashed
      },
      select: { id: true, email: true, name: true, role: true }
    });
    return user;
  } catch (error: any) {
    console.error("Error registering user:", error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to create account. Please try again.");
  }
}

// ------------------------------------
// LOGIN LOCAL USER
// ------------------------------------
export async function loginLocalUser(email: string, password: string) {
  try {
    if (!prisma) {
      throw new HttpError(500, "Database connection failed. Please try again.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true
      }
    });

    if (!user || !user.passwordHash) {
      throw new HttpError(401, "Invalid email or password");
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const { passwordHash, ...safe } = user as any;
    return safe;
  } catch (error: any) {
    console.error("Error logging in user:", error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Login failed. Please try again.");
  }
}
