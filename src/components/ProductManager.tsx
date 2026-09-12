'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct, saveProduct, type ProductInput } from '@/app/products/actions';
import { Modal } from './CustomerManager';
import { EmptyState, buttonClass, inputClass, labelClass } from './ui';
import { money } from '@/lib/format';
import type { Product } from '@/lib/types';

type Draft = Omit<ProductInput, 'unit_price'> & { unit_price: string };

const blank: Draft = {
  name: '',
  description: '',
  unit: 'ชิ้น',
  unit_price: '',
  category: '',
  is_active: true,
};

export default function ProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const term = search.trim().toLowerCase();
  const visible = term
    ? products.filter((p) =>
        [p.name, p.description, p.category].some((v) => v?.toLowerCase().includes(term))
      )
    : products;

  const submit = () => {
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const price = parseFloat(editing.unit_price);
      const result = await saveProduct({
        ...editing,
        unit_price: Number.isFinite(price) ? price : 0,
      });
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
      const result = await deleteProduct(removing.id);
      if (!result.ok) {
        setError(result.error ?? 'ลบไม่สำเร็จ');
        return;
      }
      setRemoving(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / หมวดหมู่"
        />
        <button className={`${buttonClass('primary')} ml-auto`} onClick={() => setEditing({ ...blank })}>
          + เพิ่มรายการ
        </button>
      </div>

      {error && !editing && (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={term ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีสินค้า/บริการในทะเบียน'}
          description={
            term ? undefined : 'เพิ่มรายการที่ขายบ่อย เวลาออกเอกสารจะพิมพ์ชื่อแล้วราคาเด้งมาเอง'
          }
          action={
            !term ? (
              <button className={buttonClass('primary')} onClick={() => setEditing({ ...blank })}>
                เพิ่มรายการแรก
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card divide-y divide-ink-100">
          {visible.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">
                  {p.name}
                  {p.category && (
                    <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-normal text-ink-500">
                      {p.category}
                    </span>
                  )}
                  {!p.is_active && (
                    <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-normal text-ink-400">
                      ปิดใช้งาน
                    </span>
                  )}
                </p>
                {p.description && <p className="truncate text-sm text-ink-500">{p.description}</p>}
              </div>
              <p className="shrink-0 tnum text-sm font-semibold text-ink-900">
                {money(p.unit_price)}
                <span className="font-normal text-ink-400"> / {p.unit}</span>
              </p>
              <div className="flex shrink-0 gap-1">
                <button
                  className="rounded-md px-3 py-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                  onClick={() =>
                    setEditing({
                      id: p.id,
                      name: p.name,
                      description: p.description ?? '',
                      unit: p.unit ?? '',
                      unit_price: String(Number(p.unit_price)),
                      category: p.category ?? '',
                      is_active: p.is_active,
                    })
                  }
                >
                  แก้ไข
                </button>
                <button
                  className="rounded-md px-3 py-1.5 text-sm text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => setRemoving(p)}
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'แก้ไขรายการ' : 'เพิ่มสินค้า/บริการ'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>ชื่อรายการ <span className="text-rose-500">*</span></label>
              <input
                className={inputClass}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="เช่น ลงวินโดวส์ + ไดรเวอร์ครบ"
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>รายละเอียด</label>
              <textarea
                className={inputClass}
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="ข้อความนี้จะถูกเติมเป็นรายละเอียดย่อยในเอกสาร"
              />
            </div>
            <div>
              <label className={labelClass}>ราคา/หน่วย (บาท)</label>
              <input
                className={`${inputClass} tnum text-right`}
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={editing.unit_price}
                onChange={(e) => setEditing({ ...editing, unit_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>หน่วย</label>
              <input
                className={inputClass}
                value={editing.unit}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                placeholder="ชิ้น / ชั่วโมง / งาน"
              />
            </div>
            <div>
              <label className={labelClass}>หมวดหมู่</label>
              <input
                className={inputClass}
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                placeholder="เช่น ซ่อม, อะไหล่, บริการ"
              />
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm text-ink-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-ink-300 accent-brand-600"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              เปิดใช้งาน (แสดงตอนออกเอกสาร)
            </label>
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
        <Modal onClose={() => setRemoving(null)} title={`ลบ ${removing.name}?`} narrow>
          <p className="text-sm text-ink-600">
            เอกสารเก่าที่มีรายการนี้จะยังอยู่ครบ เพราะระบบคัดลอกรายการไว้ในตัวเอกสารแล้ว
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
