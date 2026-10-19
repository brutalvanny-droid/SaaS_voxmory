import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db/index.js';
import { adminUsers } from './db/schema.js';

export const SESSION_COOKIE = 'voxmory_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 heures

/* ------------------------------------------------------------------ */
/*  Mots de passe                                                       */
/* ------------------------------------------------------------------ */

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------ */
/*  Sessions JWT signées, stockées dans un cookie httpOnly             */
/* ------------------------------------------------------------------ */

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_JWT_SECRET est manquante ou trop courte (32 caractères minimum). Générez-la avec : openssl rand -base64 48',
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // id de l'administrateur
  email: string;
  name: string;
  role: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('voxmory')
    .setAudience('voxmory-admin')
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'voxmory',
      audience: 'voxmory-admin',
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: String(payload.role ?? 'admin'),
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, // invisible pour le JavaScript du navigateur
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/* ------------------------------------------------------------------ */
/*  Middleware                                                          */
/* ------------------------------------------------------------------ */

export interface AuthedRequest extends Request {
  admin?: SessionPayload;
}

/**
 * Bloque l'accès à toute route d'administration.
 * L'identité est vérifiée côté serveur uniquement : le front-end ne décide
 * jamais de ce qui est autorisé.
 */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
    return;
  }

  // Le compte a pu être désactivé après l'émission du jeton.
  const [admin] = await db
    .select({ isActive: adminUsers.isActive })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.sub))
    .limit(1);

  if (!admin || !admin.isActive) {
    res.status(403).json({ error: 'Compte désactivé.' });
    return;
  }

  req.admin = session;
  next();
}

/* ------------------------------------------------------------------ */
/*  Journal d'audit                                                     */
/* ------------------------------------------------------------------ */

export async function logAudit(
  req: AuthedRequest,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { auditLogs } = await import('./db/schema.js');
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      adminId: req.admin?.sub ?? null,
      adminEmail: req.admin?.email ?? null,
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
      ip: clientIp(req),
    });
  } catch (err) {
    // L'audit ne doit jamais faire échouer la requête principale.
    console.error('[Audit] Échec de journalisation :', err);
  }
}

export function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'inconnue';
}
