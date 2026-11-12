'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/lib/session';

/** username ส่งกลับไปเติมในช่องเดิม เพราะ React 19 ล้างฟอร์มหลัง submit */
export type LoginState = { error?: string; username?: string };

/** เทียบข้อความแบบ constant-time (hash ก่อนเพื่อให้ยาวเท่ากันเสมอ) */
function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** รับเฉพาะ path ภายในเว็บ กันถูกใช้เป็นตัวพาไปเว็บอื่น (open redirect) */
function safeNext(next: FormDataEntryValue | null) {
  const s = typeof next === 'string' ? next : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : '/';
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass || !process.env.AUTH_SECRET) {
    return { error: 'ยังไม่ได้ตั้งค่า ADMIN_USERNAME / ADMIN_PASSWORD / AUTH_SECRET ใน .env.local' };
  }

  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  // เช็คทั้งคู่เสมอ (ไม่ใช้ &&) เวลาตอบจะไม่บอกใบ้ว่าชื่อผู้ใช้ถูกหรือผิด
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  if (!(userOk && passOk)) {
    // หน่วงนิดหน่อย ให้การเดารหัสแบบรัว ๆ ช้าลง
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', username };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect(safeNext(formData.get('next')));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
