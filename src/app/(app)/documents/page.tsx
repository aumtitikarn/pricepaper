import Link from 'next/link';
import {
  Container,
  EmptyState,
  ErrorNotice,
  LinkButton,
  PageHeader,
  SetupNotice,
  StatusBadge,
  inputClass,
} from '@/components/ui';
import { isDbConfigured, listDocuments } from '@/lib/data';
import { money, thaiDate } from '@/lib/format';
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, STATUS_OPTIONS } from '@/lib/types';
import type { DocStatus, DocType, DocumentRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const sp = await searchParams;
  const type: DocType | undefined =
    sp.type === 'receipt' ? 'receipt' : sp.type === 'quotation' ? 'quotation' : undefined;
  const status = sp.status as DocStatus | undefined;
  const search = sp.q?.trim() || undefined;

  let docs: DocumentRecord[] = [];
  let error: string | null = null;
  try {
    docs = await listDocuments({ type, status, search });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const title = type ? DOC_TYPE_LABEL[type] : 'เอกสารทั้งหมด';
  const totalValue = docs
    .filter((d) => d.status !== 'cancelled')
    .reduce((s, d) => s + Number(d.total), 0);

  return (
    <Container>
      <PageHeader
        title={title}
        subtitle={`${docs.length} ฉบับ · รวม ${money(totalValue)} บาท`}
        actions={
          <>
            {type !== 'receipt' && (
              <LinkButton href="/documents/new?type=quotation" variant={type === 'quotation' ? 'primary' : 'secondary'}>
                + ใบเสนอราคา
              </LinkButton>
            )}
            {type !== 'quotation' && (
              <LinkButton href="/documents/new?type=receipt" variant={type === 'receipt' ? 'primary' : 'secondary'}>
                + ใบเสร็จรับเงิน
              </LinkButton>
            )}
          </>
        }
      />

      {/* ตัวกรอง */}
      <form className="mb-5 flex flex-wrap items-center gap-2" action="/documents">
        {type && <input type="hidden" name="type" value={type} />}
        <input
          name="q"
          defaultValue={search ?? ''}
          className={`${inputClass} max-w-xs`}
          placeholder="ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า"
        />
        <select name="status" defaultValue={status ?? ''} className={`${inputClass} w-auto`}>
          <option value="">ทุกสถานะ</option>
          {(type ? STATUS_OPTIONS[type] : (Object.keys(DOC_STATUS_LABEL) as DocStatus[])).map((s) => (
            <option key={s} value={s}>{DOC_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button className="rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50">
          กรอง
        </button>
        {(search || status) && (
          <Link
            href={type ? `/documents?type=${type}` : '/documents'}
            className="px-2 text-sm text-ink-500 underline-offset-2 hover:underline"
          >
            ล้างตัวกรอง
          </Link>
        )}
      </form>

      {error ? (
        <ErrorNotice message={error} />
      ) : docs.length === 0 ? (
        <EmptyState
          title="ยังไม่มีเอกสาร"
          description={
            search || status
              ? 'ไม่พบเอกสารที่ตรงกับตัวกรอง ลองล้างตัวกรองดู'
              : 'เริ่มจากสร้างใบเสนอราคาใบแรก'
          }
          action={<LinkButton href={`/documents/new?type=${type ?? 'quotation'}`}>สร้างเอกสารใหม่</LinkButton>}
        />
      ) : (
        <div className="card overflow-hidden">
          {/* ตารางสำหรับจอกว้าง */}
          <table className="hidden w-full text-sm sm:table">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">เลขที่</th>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">ยอดสุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {docs.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/documents/${d.id}`} className="font-mono font-medium text-brand-700 hover:underline">
                      {d.doc_number}
                    </Link>
                    {!type && (
                      <span className="ml-2 text-xs text-ink-400">{DOC_TYPE_LABEL[d.doc_type]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/documents/${d.id}`} className="block text-ink-800 hover:underline">
                      {d.customer_company || d.customer_name || '-'}
                    </Link>
                    {d.customer_company && d.customer_name && (
                      <span className="text-xs text-ink-400">{d.customer_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                    {thaiDate(d.issue_date, 'short')}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-right tnum font-semibold text-ink-900">
                    {money(d.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* การ์ดสำหรับมือถือ */}
          <ul className="divide-y divide-ink-100 sm:hidden">
            {docs.map((d) => (
              <li key={d.id}>
                <Link href={`/documents/${d.id}`} className="block px-4 py-3.5 active:bg-ink-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-medium text-brand-700">{d.doc_number}</span>
                    <span className="tnum font-semibold text-ink-900">{money(d.total)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-ink-700">
                      {d.customer_company || d.customer_name || '-'}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">{thaiDate(d.issue_date, 'short')}</span>
                  </div>
                  <div className="mt-2"><StatusBadge status={d.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}
