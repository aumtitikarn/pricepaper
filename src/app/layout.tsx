import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { getShopSettings } from '@/lib/data';

const plexThai = IBM_Plex_Sans_Thai({
  variable: '--font-plex-thai',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบเอกสาร | ร้านนักเรียนไอที',
  description: 'ออกใบเสนอราคาและใบเสร็จรับเงิน สำหรับร้านนักเรียนไอที',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getShopSettings();

  return (
    <html lang="th">
      <body className={`${plexThai.variable} antialiased`}>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar shopName={settings.name} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
