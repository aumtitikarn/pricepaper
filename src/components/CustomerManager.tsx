'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteCustomer, saveCustomer, type CustomerInput } from '@/app/customers/actions';
import { EmptyState, buttonClass, inputClass, labelClass } from './ui';
import type { Customer } from '@/lib/types';

const PAGE_SIZE = 10;

const blank: CustomerInput = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  tax_id: '',
  note: '',
};

export default function CustomerManager({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CustomerInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.company, c.phone, c.email].some((v) => v?.toLowerCase().includes(term))
    );
  }, [customers, search]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));

  // ค้นหาแล้วผลลัพธ์สั้นลง หน้าที่ค้างอยู่อาจเกินจำนวนหน้าจริง จึงดึงกลับมาให้
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const start = (page - 1) * PAGE_SIZE;
  const rows = visible.slice(start, start + PAGE_SIZE);

  const submit = () => {
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const result = await saveCustomer(editing);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  };

  const confirmRemove = () => {
    if (!removing) return;
    startTransition(async () => {
      const result = await deleteCustomer(removing.id);
      if (!result.ok) {
        setError(result.error ?? 'ลบไม่สำเร็จ');
        return;
      }
      setRemoving(null);
      router.refresh();
    });
  };

  const openEdit = (c: Customer) =>
    setEditing({
      id: c.id,
      name: c.name ?? '',
      company: c.company ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      tax_id: c.tax_id ?? '',
      note: c.note ?? '',
    });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="ค้นหาชื่อ / บริษัท / เบอร์โทร"
        />
        <button className={`${buttonClass('primary')} ml-auto`} onClick={() => setEditing({ ...blank })}>
          + เพิ่มลูกค้า
        </button>
      </div>

      {error && !editing && (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={search.trim() ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้าในทะเบียน'}
          description={
            search.trim() ? undefined : 'เพิ่มลูกค้าไว้ เวลาออกเอกสารจะเลือกได้เลยไม่ต้องพิมพ์ซ้ำ'
          }
          action={
            !search.trim() ? (
              <button className={buttonClass('primary')} onClick={() => setEditing({ ...blank })}>
                เพิ่มลูกค้าคนแรก
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ชื่อลูกค้า</th>
                  <th className="px-4 py-3 text-left font-medium">บริษัท / หน่วยงาน</th>
                  <th className="px-4 py-3 text-left font-medium">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left font-medium">อีเมล</th>
                  <th className="px-4 py-3 text-right font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {/* ชื่อว่างได้ — กันไม่ให้แถวโล่งจนอ่านไม่รู้เรื่อง */}
                      {c.name || <span className="font-normal text-ink-400">(ไม่ระบุชื่อ)</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{c.company || '—'}</td>
                    <td className="px-4 py-3 tnum text-ink-600">{c.phone || '—'}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-ink-600">
                      {c.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        <Link
                          href={`/documents?q=${encodeURIComponent(c.name || c.phone || '')}`}
                          className="rounded-md px-2.5 py-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                        >
                          เอกสาร
                        </Link>
                        <button
                          className="rounded-md px-2.5 py-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                          onClick={() => openEdit(c)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="rounded-md px-2.5 py-1.5 text-sm text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setRemoving(c)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={visible.length}
            from={start + 1}
            to={Math.min(start + PAGE_SIZE, visible.length)}
            onChange={setPage}
          />
        </div>
      )}

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อลูกค้า</label>
              <input
                className={inputClass}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>บริษัท / หน่วยงาน</label>
              <input
                className={inputClass}
                value={editing.company}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>เบอร์โทร</label>
              <input
                className={inputClass}
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>อีเมล</label>
              <input
                className={inputClass}
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>ที่อยู่</label>
              <textarea
                className={inputClass}
                rows={2}
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>เลขประจำตัวผู้เสียภาษี</label>
              <input
                className={inputClass}
                value={editing.tax_id}
                onChange={(e) => setEditing({ ...editing, tax_id: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>โน้ตภายใน</label>
              <input
                className={inputClass}
                value={editing.note}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                placeholder="ไม่แสดงบนเอกสาร"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button className={buttonClass('secondary')} onClick={() => setEditing(null)}>ยกเลิก</button>
            <button className={buttonClass('primary')} onClick={submit} disabled={pending}>
              {pending ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </Modal>
      )}

      {removing && (
        <Modal
          onClose={() => setRemoving(null)}
          title={`ลบ ${removing.name || 'ลูกค้ารายนี้'}?`}
          narrow
        >
          <p className="text-sm text-ink-600">
            เอกสารเก่าที่ออกให้ลูกค้ารายนี้จะยังอยู่ครบ เพราะระบบเก็บข้อมูลลูกค้าไว้ในตัวเอกสารแล้ว
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button className={buttonClass('secondary')} onClick={() => setRemoving(null)}>ยกเลิก</button>
            <button className={buttonClass('danger')} onClick={confirmRemove} disabled={pending}>
              {pending ? 'กำลังลบ…' : 'ลบ'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  from,
  to,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  onChange: (page: number) => void;
}) {
  // หน้าเดียวก็ยังบอกจำนวนรวม แต่ไม่ต้องโชว์ปุ่มให้รก
  const numbers = pageWindow(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-4 py-3">
      <p className="text-sm text-ink-500">
        แสดง {from}–{to} จาก {total} ราย
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <PageButton disabled={page === 1} onClick={() => onChange(page - 1)} label="ก่อนหน้า">
            <path d="m15 18-6-6 6-6" />
          </PageButton>

          {numbers.map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-ink-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`min-w-9 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  p === page
                    ? 'bg-brand-600 font-medium text-white'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {p}
              </button>
            )
          )}

          <PageButton
            disabled={page === pageCount}
            onClick={() => onChange(page + 1)}
            label="ถัดไป"
          >
            <path d="m9 18 6-6-6-6" />
          </PageButton>
        </div>
      )}
    </div>
  );
}

/** เลขหน้าแบบย่อ เช่น 1 … 4 5 6 … 20 */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

function PageButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-md p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

export function Modal({
  title,
  children,
  onClose,
  narrow,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  narrow?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 py-10"
      onClick={onClose}
    >
      <div
        className={`card w-full p-6 ${narrow ? 'max-w-sm' : 'max-w-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-lg font-semibold text-ink-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}
