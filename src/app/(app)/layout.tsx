import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getShopSettings } from '@/lib/data';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/** ทุกหน้าในกลุ่มนี้ต้องเข้าสู่ระบบก่อน (หน้า /login อยู่นอกกลุ่ม จึงไม่มีแถบเมนู) */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // middleware กันไว้แล้ว ตรงนี้เช็คซ้ำอีกชั้นเผื่อ middleware ถูกข้าม
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect('/login');

  const settings = await getShopSettings();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar shopName={settings.name} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
