import { randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { and, eq, isNull } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db/index.js';
import { orders, users } from './db/schema.js';

/**
 * Authentification des comptes clients.
 *
 * Volontairement séparée de celle du studio (`auth.ts`) : les jetons sont
 * signés avec une audience et un cookie distincts. Sans cette séparation, un
 * compte client pourrait fabriquer une session d'administration — la confusion
 * d'audience est une faille classique et grave.
 *
 * Un client n'accède qu'à ses propres commandes. Le studio, lui, voit tout.
 */

export const CLIENT_SESSION_COOKIE = 'voxmory_client_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET est manquante ou trop courte.');
  }
  return new TextEncoder().encode(secret);
}

export interface ClientSession {
  sub: string;
  email: string;
  name: string;
}

export async function createClientSessionToken(
  user: { id: string; email: string; name: string },
): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer('voxmory')
    .setAudience('voxmory-client')
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyClientSessionToken(
  token: string,
): Promise<ClientSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'voxmory',
      audience: 'voxmory-client',
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
    };
  } catch {
    return null;
  }
}

export function setClientSessionCookie(res: Response, token: string): void {
  res.cookie(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS * 1000,
    path: '/',
  });
}

export function clearClientSessionCookie(res: Response): void {
  res.clearCookie(CLIENT_SESSION_COOKIE, { path: '/' });
}

/* ------------------------------------------------------------------ */
/*  Lecture de la session courante                                      */
/* ------------------------------------------------------------------ */

export interface ClientRequest extends Request {
  client?: ClientSession;
}

/** Charge la session cliente si elle existe, sans jamais bloquer. */
export async function loadClient(
  req: ClientRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[CLIENT_SESSION_COOKIE];
  if (!token) {
    next();
    return;
  }

  try {
    const session = await verifyClientSessionToken(token);
    if (!session) {
      next();
      return;
    }

    // Le compte a pu être désactivé après l'émission du jeton.
    const [user] = await db
      .select({ isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);

    if (!user || !user.isActive) {
      next();
      return;
    }

    req.client = session;
  } catch {
    // Session illisible : on continue en visiteur.
  }

  next();
}

/** Bloque l'accès si aucune session cliente valide. */
export async function requireClient(
  req: ClientRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.client) {
    res.status(401).json({ error: 'Connectez-vous pour accéder à votre compte.' });
    return;
  }
  next();
}

/* ------------------------------------------------------------------ */
/*  Rattachement des commandes                                          */
/* ------------------------------------------------------------------ */

/**
 * Associe à un compte toutes les commandes passées en invité avec la même
 * adresse e-mail.
 *
 * Sans cela, un client qui commande avant de créer son compte perdrait son
 * historique — et croirait sa commande disparue. C'est le genre de détail qui
 * déclenche des réclamations.
 */
export async function linkGuestOrders(userId: string, email: string): Promise<number> {
  if (!email) return 0;

  const result = await db
    .update(orders)
    .set({ userId })
    .where(and(eq(orders.customerEmail, email.toLowerCase()), isNull(orders.userId)))
    .returning({ id: orders.id });

  return result.length;
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}
