import { CookieOptions } from 'express';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}. Copie .env.example para backend/.env.`);
  }
  return value;
}

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const accessSecret = () => requireEnv('JWT_ACCESS_SECRET');
export const refreshSecret = () => requireEnv('JWT_REFRESH_SECRET');

export function cookieOptions(maxAge?: number): CookieOptions {
  // In production the API and the frontend are on different origins (e.g. Render + a
  // separately hosted site), so the cookie needs SameSite=None — which browsers only
  // accept together with Secure. Locally, both run on http://localhost, where
  // SameSite=Lax works and Secure would block the cookie entirely (no HTTPS).
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}
