import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${plexThai.variable} antialiased`}>{children}</body>
    </html>
  );
}
