import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | ร้านนักเรียนไอที',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-base font-bold text-white">
            IT
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">เข้าสู่ระบบ</h1>
            <p className="mt-1 text-sm text-ink-500">ระบบเอกสาร ร้านนักเรียนไอที</p>
          </div>
        </div>

        <div className="card p-6">
          <LoginForm next={next ?? '/'} />
        </div>
      </div>
    </div>
  );
}
