import Link from 'next/link';
import {
  Container,
  EmptyState,
  ErrorNotice,
  LinkButton,
  PageHeader,
  SetupNotice,
  StatusBadge,
} from '@/components/ui';
import { isDbConfigured, getDashboardStats, listDocuments, type DashboardStats } from '@/lib/data';
import { money, thaiDate } from '@/lib/format';
import { DOC_TYPE_LABEL, type DocumentRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!isDbConfigured) return <SetupNotice />;

  let stats: DashboardStats | null = null;
  let recent: DocumentRecord[] = [];
  let error: string | null = null;

  try {
    [stats, recent] = await Promise.all([
      getDashboardStats(),
      listDocuments({ limit: 8 }),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const thisMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  return (
    <Container>
      <PageHeader
        title="ภาพรวม"
        subtitle="สรุปเอกสารและยอดขายของร้าน"
        actions={
          <>
            <LinkButton href="/documents/new?type=quotation">+ ใบเสนอราคา</LinkButton>
            <LinkButton href="/documents/new?type=receipt" variant="secondary">
              + ใบเสร็จรับเงิน
            </LinkButton>
          </>
        }
      />

      {error ? (
        <ErrorNotice message={error} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={`รายรับเดือน${thisMonth}`}
              value={`${money(stats!.monthRevenue)} ฿`}
              hint={`จากใบเสร็จ ${stats!.monthReceiptCount} ฉบับ`}
              accent
            />
            <StatCard
              label="ใบเสนอราคารอตอบรับ"
              value={String(stats!.pendingQuotations)}
              hint={`มูลค่ารวม ${money(stats!.pendingValue)} ฿`}
              href="/documents?type=quotation&status=sent"
            />
            <StatCard
              label="ใบเสนอราคาทั้งหมด"
              value={String(stats!.quotationCount)}
              hint="ตั้งแต่เริ่มใช้ระบบ"
              href="/documents?type=quotation"
            />
            <StatCard
              label="ใบเสร็จรับเงินทั้งหมด"
              value={String(stats!.receiptCount)}
              hint="ตั้งแต่เริ่มใช้ระบบ"
              href="/documents?type=receipt"
            />
          </div>

          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <h2 className="font-semibold text-ink-900">เอกสารล่าสุด</h2>
              <Link href="/documents" className="text-sm font-medium text-brand-600 hover:underline">
                ดูทั้งหมด
              </Link>
            </header>

            {recent.length === 0 ? (
              <div className="p-2">
                <EmptyState
                  title="ยังไม่มีเอกสาร"
                  description="สร้างใบเสนอราคาใบแรกเพื่อเริ่มใช้งาน"
                  action={<LinkButton href="/documents/new?type=quotation">สร้างใบเสนอราคา</LinkButton>}
                />
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {recent.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/documents/${d.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-brand-50/40"
                    >
                      <span className="w-32 shrink-0 font-mono text-sm font-medium text-brand-700">
                        {d.doc_number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-800">
                        {d.customer_company || d.customer_name || '-'}
                        <span className="ml-2 text-xs text-ink-400">{DOC_TYPE_LABEL[d.doc_type]}</span>
                      </span>
                      <StatusBadge status={d.status} />
                      <span className="w-24 shrink-0 text-right text-xs text-ink-400">
                        {thaiDate(d.issue_date, 'short')}
                      </span>
                      <span className="w-28 shrink-0 text-right tnum font-semibold text-ink-900">
                        {money(d.total)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Container>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <div
      className={`card h-full p-5 transition-shadow ${href ? 'hover:shadow-md' : ''} ${
        accent ? 'border-brand-200 bg-brand-50' : ''
      }`}
    >
      <p className={`text-sm ${accent ? 'text-brand-700' : 'text-ink-500'}`}>{label}</p>
      <p
        className={`mt-2 text-2xl font-bold tnum ${accent ? 'text-brand-700' : 'text-ink-900'}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
