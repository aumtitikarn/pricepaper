'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { convertToReceipt, deleteDocument, updateStatus } from '@/app/documents/actions';
import { buttonClass, inputClass } from './ui';
import { DOC_STATUS_LABEL, STATUS_OPTIONS, type DocStatus, type DocType } from '@/lib/types';

export default function DocumentToolbar({
  id,
  docNumber,
  docType,
  status,
  hasReceipt,
}: {
  id: string;
  docNumber: string;
  docType: DocType;
  status: DocStatus;
  hasReceipt: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        // redirect() ของ Next ทำงานด้วยการ throw — ปล่อยผ่าน ไม่ใช่ error จริง
        if (e instanceof Error && e.message.startsWith('NEXT_REDIRECT')) throw e;
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="no-print mb-5">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <Link href={`/documents?type=${docType}`} className="mr-auto flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="font-mono">{docNumber}</span>
        </Link>

        <select
          className={`${inputClass} w-auto py-2`}
          value={status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as DocStatus;
            run(() => updateStatus(id, next));
          }}
        >
          {STATUS_OPTIONS[docType].map((s) => (
            <option key={s} value={s}>{DOC_STATUS_LABEL[s]}</option>
          ))}
        </select>

        {docType === 'quotation' && !hasReceipt && (
          <button
            className={buttonClass('secondary')}
            disabled={pending}
            onClick={() => run(() => convertToReceipt(id))}
          >
            สร้างใบเสร็จจากใบนี้
          </button>
        )}

        <Link href={`/documents/${id}/edit`} className={buttonClass('secondary')}>
          แก้ไข
        </Link>

        <button
          className={buttonClass('secondary')}
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          ลบ
        </button>

        <button className={buttonClass('primary')} onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          พิมพ์ / บันทึก PDF
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h3 className="font-semibold text-ink-900">ลบเอกสาร {docNumber}?</h3>
            <p className="mt-2 text-sm text-ink-600">
              รายการทั้งหมดในเอกสารนี้จะถูกลบไปด้วย และกู้คืนไม่ได้
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={buttonClass('secondary')} onClick={() => setConfirming(false)}>
                ยกเลิก
              </button>
              <button
                className={buttonClass('danger')}
                disabled={pending}
                onClick={() => run(() => deleteDocument(id))}
              >
                {pending ? 'กำลังลบ…' : 'ลบถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
