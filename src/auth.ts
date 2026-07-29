// Session cookie signing/verification and login credential checks.
// Cookie format: base64url(username|expiryEpochSeconds) + "." + base64url(HMAC-SHA256 signature)

export interface Env {
  DB: D1Database;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
  SESSION_SECRET: string;
}

export const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return new Uint8Array(sig);
}

// Constant-time string comparison: compare SHA-256 digests so length leaks nothing.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function checkCredentials(env: Env, username: string, password: string): Promise<boolean> {
  const userOk = await safeEqual(username, env.AUTH_USERNAME);
  const passOk = await safeEqual(password, env.AUTH_PASSWORD);
  return userOk && passOk;
}

export async function createSessionCookie(env: Env, username: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${username}|${expiry}`;
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const sig = toBase64Url(await sign(env.SESSION_SECRET, payload));
  const value = `${payloadB64}.${sig}`;
  return `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function verifySessionCookie(env: Env, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf('.');
  if (dot < 0) return false;
  const payloadBytes = fromBase64Url(cookieValue.slice(0, dot));
  if (!payloadBytes) return false;
  const payload = new TextDecoder().decode(payloadBytes);
  const expectedSig = toBase64Url(await sign(env.SESSION_SECRET, payload));
  if (!(await safeEqual(cookieValue.slice(dot + 1), expectedSig))) return false;
  const parts = payload.split('|');
  if (parts.length !== 2) return false;
  const expiry = parseInt(parts[1], 10);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  return true;
}
