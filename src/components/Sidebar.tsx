'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'ภาพรวม', icon: HomeIcon, exact: true },
  { href: '/documents?type=quotation', label: 'ใบเสนอราคา', icon: QuoteIcon, match: '/documents' },
  { href: '/documents?type=receipt', label: 'ใบเสร็จรับเงิน', icon: ReceiptIcon, match: '/documents' },
  { href: '/customers', label: 'ลูกค้า', icon: UsersIcon },
  { href: '/products', label: 'สินค้า/บริการ', icon: BoxIcon },
  { href: '/settings', label: 'ตั้งค่าร้าน', icon: GearIcon },
];

export default function Sidebar({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.exact) return pathname === item.href;
    const base = item.match ?? item.href;
    return pathname === base || pathname.startsWith(base + '/');
  };

  return (
    <>
      {/* แถบบนสำหรับมือถือ */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-ink-900">{shopName}</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          aria-label="เปิดเมนู"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </header>

      {open && (
        <div
          className="no-print fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={[
          'no-print fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col border-r border-ink-200 bg-white',
          'transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 lg:flex',
          open ? 'flex translate-x-0' : 'hidden -translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 border-b border-ink-200 px-5 py-5">
          <Logo />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{shopName}</p>
            <p className="text-xs text-ink-400">ระบบเอกสาร</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                ].join(' ')}
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ink-200 p-3">
          <Link
            href="/documents/new?type=quotation"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            สร้างเอกสารใหม่
          </Link>
        </div>
      </aside>
    </>
  );
}

function Logo() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
      IT
    </span>
  );
}

/* ---------- icons ---------- */
const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M18 14.8c2 .7 3 2.5 3 5.2" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  );
}
