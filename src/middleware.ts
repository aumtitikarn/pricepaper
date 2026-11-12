import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/**
 * ด่านแรกของทุก request รวมถึง Server Action (ซึ่งเป็น POST ไปที่ URL ของหน้า)
 * ยังไม่เข้าสู่ระบบ → ส่งไปหน้า /login พร้อมจำหน้าที่ตั้งใจจะเปิด
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/login') {
    // เข้าสู่ระบบอยู่แล้วไม่ต้องเห็นหน้า login อีก
    return authed ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }

  if (authed) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  if (pathname !== '/') loginUrl.searchParams.set('next', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // ปล่อยไฟล์ static ของ Next และ favicon ผ่านไป ที่เหลือต้องเข้าสู่ระบบ
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
