/**
 * session แบบเบา ๆ ไม่ต้องมีตารางในฐานข้อมูล
 *
 * cookie เก็บ `<username>.<หมดอายุ unix>.<ลายเซ็น HMAC-SHA256>`
 * ใครแก้ค่าใน cookie เองลายเซ็นจะไม่ตรง จึงปลอมไม่ได้ถ้าไม่รู้ AUTH_SECRET
 *
 * ใช้ Web Crypto (crypto.subtle) เพราะไฟล์นี้ถูกเรียกจาก middleware
 * ซึ่งรันบน Edge runtime ที่ไม่มีโมดูล `crypto` ของ Node
 */

export const SESSION_COOKIE = 'pp_session';

/** อยู่ในระบบได้ 7 วันก่อนต้องเข้าสู่ระบบใหม่ */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export async function createSessionToken(username: string): Promise<string> {
  const key = await getKey();
  if (!key) throw new Error('ยังไม่ได้ตั้งค่า AUTH_SECRET ใน .env.local');

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${username}.${exp}`;
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return `${payload}.${toBase64Url(sig)}`;
}

/** true เมื่อ cookie มีลายเซ็นถูกต้องและยังไม่หมดอายุ */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const key = await getKey();
  if (!key) return false;

  const sigAt = token.lastIndexOf('.');
  if (sigAt <= 0) return false;
  const payload = token.slice(0, sigAt);
  const sig = fromBase64Url(token.slice(sigAt + 1));
  if (!sig) return false;

  const exp = Number(payload.slice(payload.lastIndexOf('.') + 1));
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;

  // verify เทียบลายเซ็นแบบ constant-time ให้เอง กันเดาลายเซ็นจากเวลาตอบกลับ
  return crypto.subtle.verify('HMAC', key, sig, encoder.encode(payload));
}
