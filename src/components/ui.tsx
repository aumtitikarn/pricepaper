import Link from 'next/link';
import type { DocStatus } from '@/lib/types';
import { DOC_STATUS_LABEL } from '@/lib/types';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>;
}

const STATUS_STYLE: Record<DocStatus, string> = {
  draft: 'bg-ink-100 text-ink-600 ring-ink-200',
  sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-ink-100 text-ink-400 ring-ink-200 line-through',
};

export function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {DOC_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>
      <p className="font-medium text-ink-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** ปุ่มลิงก์สไตล์หลัก/รอง — ใช้ร่วมกันทั้งเว็บ */
export function LinkButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link href={href} className={buttonClass(variant)}>
      {children}
    </Link>
  );
}

export function buttonClass(variant: 'primary' | 'secondary' | 'danger' = 'primary') {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  if (variant === 'primary') return `${base} bg-brand-600 text-white hover:bg-brand-700`;
  if (variant === 'danger') return `${base} bg-rose-600 text-white hover:bg-rose-700`;
  return `${base} border border-ink-300 bg-white text-ink-700 hover:bg-ink-50`;
}

export const inputClass =
  'w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const labelClass = 'mb-1.5 block text-sm font-medium text-ink-700';

/** ขึ้นเมื่อยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล */
export function SetupNotice() {
  return (
    <Container>
      <div className="card mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold text-ink-900">ยังไม่ได้เชื่อมต่อฐานข้อมูล</h1>
        <p className="mt-2 text-sm text-ink-600">
          สร้างไฟล์ <code className="rounded bg-ink-100 px-1.5 py-0.5 text-ink-800">.env.local</code>{' '}
          ที่รากโปรเจกต์ แล้วใส่ connection string จาก Supabase &gt; Project Settings &gt;
          Database &gt; Connection string &gt; Transaction pooler
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ink-900 p-4 text-xs leading-relaxed text-ink-100">
{`DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:6543/postgres?pgbouncer=true"`}
        </pre>
        <p className="mt-4 text-sm text-ink-600">
          จากนั้นรัน <code className="rounded bg-ink-100 px-1.5 py-0.5 text-ink-800">supabase/schema.sql</code>{' '}
          และ <code className="rounded bg-ink-100 px-1.5 py-0.5 text-ink-800">supabase/lockdown.sql</code>{' '}
          ใน SQL Editor ของ Supabase แล้วรีสตาร์ต dev server
        </p>
      </div>
    </Container>
  );
}

/** ขึ้นเมื่อ query พัง (มักเพราะยังไม่ได้รัน schema.sql) */
export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="card border-rose-200 bg-rose-50 p-6">
      <p className="font-medium text-rose-900">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      <p className="mt-3 text-sm text-rose-700">
        ถ้าเพิ่งตั้งค่าครั้งแรก ตรวจว่ารัน <code className="font-mono">supabase/schema.sql</code> และ{' '}
        <code className="font-mono">supabase/lockdown.sql</code> ใน Supabase แล้ว
      </p>
    </div>
  );
}
