'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DocumentPaper, { type PaperDoc } from './DocumentPaper';
import PaperPreview from './PaperPreview';
import { saveDocument, type DocumentPayload } from '@/app/documents/actions';
import { addDaysISO, money, todayISO } from '@/lib/format';
import { buttonClass, inputClass, labelClass } from './ui';
import {
  DOC_STATUS_LABEL,
  DOC_TYPE_LABEL,
  PAYMENT_METHODS,
  STATUS_OPTIONS,
  type Customer,
  type DocStatus,
  type DocType,
  type DocumentWithItems,
  type Product,
  type ShopSettings,
} from '@/lib/types';

/** จำนวน/ราคาเก็บเป็น string ระหว่างพิมพ์ เพื่อให้ลบเลขทิ้งได้ไม่ติด "0" */
type EditorItem = {
  key: string;
  description: string;
  detail: string;
  unit: string;
  quantity: string;
  unit_price: string;
};

const newKey = () => Math.random().toString(36).slice(2);

const emptyItem = (): EditorItem => ({
  key: newKey(),
  description: '',
  detail: '',
  unit: '',
  quantity: '1',
  unit_price: '',
});

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export default function DocumentEditor({
  mode,
  docType,
  initial,
  customers,
  products,
  shop,
}: {
  mode: 'create' | 'edit';
  docType: DocType;
  initial?: DocumentWithItems;
  customers: Customer[];
  products: Product[];
  shop: ShopSettings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'form' | 'preview'>('form');

  const isReceipt = docType === 'receipt';

  const [customerId, setCustomerId] = useState<string>(initial?.customer_id ?? '');
  const [customer, setCustomer] = useState({
    name: initial?.customer_name ?? '',
    company: initial?.customer_company ?? '',
    phone: initial?.customer_phone ?? '',
    email: initial?.customer_email ?? '',
    address: initial?.customer_address ?? '',
    tax_id: initial?.customer_tax_id ?? '',
  });
  const [saveAsCustomer, setSaveAsCustomer] = useState(false);

  const [docNumber, setDocNumber] = useState(initial?.doc_number ?? '');
  const [issueDate, setIssueDate] = useState(initial?.issue_date?.slice(0, 10) ?? todayISO());
  const [validUntil, setValidUntil] = useState(
    initial?.valid_until?.slice(0, 10) ?? (isReceipt ? '' : addDaysISO(todayISO(), 14))
  );
  const [paidAt, setPaidAt] = useState(
    initial?.paid_at?.slice(0, 10) ?? (isReceipt ? todayISO() : '')
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initial?.payment_method || (isReceipt ? 'เงินสด' : '')
  );
  const [status, setStatus] = useState<DocStatus>(
    initial?.status ?? (isReceipt ? 'paid' : 'draft')
  );
  const [discount, setDiscount] = useState(
    initial ? String(Number(initial.discount) || '') : ''
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [terms, setTerms] = useState(
    initial?.terms ?? (isReceipt ? '' : shop.quotation_terms)
  );

  const [items, setItems] = useState<EditorItem[]>(() =>
    initial?.document_items?.length
      ? initial.document_items.map((it) => ({
          key: newKey(),
          description: it.description,
          detail: it.detail ?? '',
          unit: it.unit ?? '',
          quantity: String(Number(it.quantity)),
          unit_price: String(Number(it.unit_price)),
        }))
      : [emptyItem()]
  );

  /* ---------- คำนวณยอด (ตรงกับสูตรฝั่ง server) ---------- */
  const totals = useMemo(() => {
    const rows = items.map((it) => ({
      ...it,
      amount: Math.round(num(it.quantity) * num(it.unit_price) * 100) / 100,
    }));
    const subtotal = Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;
    const disc = Math.min(Math.max(num(discount), 0), subtotal);
    return { rows, subtotal, discount: disc, total: Math.round((subtotal - disc) * 100) / 100 };
  }, [items, discount]);

  /* ---------- เอกสารตัวอย่าง ---------- */
  const previewDoc: PaperDoc = useMemo(
    () => ({
      doc_type: docType,
      doc_number: docNumber.trim(),
      issue_date: issueDate,
      valid_until: isReceipt ? null : validUntil || null,
      customer_name: customer.name,
      customer_company: customer.company,
      customer_phone: customer.phone,
      customer_email: customer.email,
      customer_address: customer.address,
      customer_tax_id: customer.tax_id,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      payment_method: isReceipt ? paymentMethod : '',
      paid_at: isReceipt ? paidAt || null : null,
      notes,
      terms,
      items: totals.rows
        .filter((r) => r.description.trim() !== '' || r.amount !== 0)
        .map((r) => ({
          description: r.description,
          detail: r.detail,
          unit: r.unit,
          quantity: num(r.quantity),
          unit_price: num(r.unit_price),
          amount: r.amount,
        })),
    }),
    [docType, docNumber, issueDate, validUntil, isReceipt, customer, totals, paymentMethod, paidAt, notes, terms]
  );

  /* ---------- actions ---------- */
  const updateItem = (key: string, patch: Partial<EditorItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const removeItem = (key: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  /** เลือกสินค้าจากทะเบียน — เติมราคา/หน่วย/รายละเอียดให้อัตโนมัติ */
  const applyProduct = (key: string, productName: string) => {
    const product = products.find((p) => p.name === productName);
    if (!product) {
      updateItem(key, { description: productName });
      return;
    }
    updateItem(key, {
      description: product.name,
      detail: product.description || '',
      unit: product.unit || '',
      unit_price: String(Number(product.unit_price)),
    });
  };

  const pickCustomer = (id: string) => {
    setCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomer({
        name: found.name,
        company: found.company ?? '',
        phone: found.phone ?? '',
        email: found.email ?? '',
        address: found.address ?? '',
        tax_id: found.tax_id ?? '',
      });
      setSaveAsCustomer(false);
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: DocumentPayload = {
        id: initial?.id,
        doc_number: docNumber.trim(),
        doc_type: docType,
        status,
        issue_date: issueDate,
        valid_until: isReceipt ? null : validUntil || null,
        customer_id: customerId || null,
        customer_name: customer.name,
        customer_company: customer.company,
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_address: customer.address,
        customer_tax_id: customer.tax_id,
        discount: num(discount),
        payment_method: isReceipt ? paymentMethod : '',
        paid_at: isReceipt ? paidAt || null : null,
        source_document_id: initial?.source_document_id ?? null,
        notes,
        terms,
        save_customer: saveAsCustomer && !customerId,
        items: items.map((it) => ({
          description: it.description,
          detail: it.detail,
          unit: it.unit,
          quantity: num(it.quantity),
          unit_price: num(it.unit_price),
        })),
      };

      const result = await saveDocument(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/documents/${result.id}`);
    });
  };

  /* ---------- render ---------- */
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* แถบหัวเรื่อง */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">
            {mode === 'create' ? 'สร้างใหม่' : `แก้ไข ${initial?.doc_number}`}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {DOC_TYPE_LABEL[docType]}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={initial ? `/documents/${initial.id}` : '/documents'} className={buttonClass('secondary')}>
            ยกเลิก
          </Link>
          <button onClick={handleSave} disabled={pending} className={buttonClass('primary')}>
            {pending ? 'กำลังบันทึก…' : 'บันทึกเอกสาร'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* สลับแท็บ (เฉพาะจอเล็ก — จอใหญ่แสดงคู่กัน) */}
      <div className="mb-4 flex gap-1 rounded-lg bg-ink-200/60 p-1 xl:hidden">
        {(['form', 'preview'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600'
            }`}
          >
            {t === 'form' ? 'กรอกข้อมูล' : 'ดูตัวอย่าง'}
          </button>
        ))}
      </div>

      {/* minmax(0,1fr) จำเป็น — ไม่งั้น grid track จะโตตามกระดาษ 794px แล้วหน้าจะล้นแนวนอนบนมือถือ */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        {/* ================= ฟอร์ม ================= */}
        <div className={`space-y-5 ${tab === 'preview' ? 'hidden xl:block' : ''}`}>
          {/* ลูกค้า */}
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-ink-900">ข้อมูลลูกค้า</h2>

            <div className="mb-4">
              <label className={labelClass}>เลือกจากทะเบียนลูกค้า</label>
              <select
                className={inputClass}
                value={customerId}
                onChange={(e) => pickCustomer(e.target.value)}
              >
                <option value="">— ลูกค้าใหม่ (กรอกเอง) —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {/* ชื่อลูกค้าว่างได้ จึงประกอบป้ายจากส่วนที่มีจริงเท่านั้น */}
                    {[c.name, c.company, c.phone].filter(Boolean).join(' · ') ||
                      '(ไม่ระบุชื่อ)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อลูกค้า" required>
                <input
                  className={inputClass}
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="สมชาย ใจดี"
                />
              </Field>
              <Field label="บริษัท / หน่วยงาน">
                <input
                  className={inputClass}
                  value={customer.company}
                  onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                  placeholder="(ถ้ามี)"
                />
              </Field>
              <Field label="เบอร์โทร">
                <input
                  className={inputClass}
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="08x-xxx-xxxx"
                />
              </Field>
              <Field label="อีเมล">
                <input
                  className={inputClass}
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </Field>
              <Field label="ที่อยู่" full>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <input
                  className={inputClass}
                  value={customer.tax_id}
                  onChange={(e) => setCustomer({ ...customer, tax_id: e.target.value })}
                />
              </Field>
            </div>

            {!customerId && customer.name.trim() !== '' && (
              <label className="mt-4 flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 accent-brand-600"
                  checked={saveAsCustomer}
                  onChange={(e) => setSaveAsCustomer(e.target.checked)}
                />
                บันทึกลูกค้ารายนี้เข้าทะเบียนด้วย
              </label>
            )}
          </section>

          {/* รายการ */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">รายการสินค้า / บริการ</h2>
              <span className="text-sm text-ink-400">{items.length} รายการ</span>
            </div>

            <datalist id="product-options">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {money(p.unit_price)} บาท / {p.unit}
                </option>
              ))}
            </datalist>

            <div className="space-y-3">
              {items.map((item, index) => {
                const amount = Math.round(num(item.quantity) * num(item.unit_price) * 100) / 100;
                return (
                  <div key={item.key} className="rounded-xl border border-ink-200 bg-ink-50/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-100 text-xs font-semibold text-brand-700">
                        {index + 1}
                      </span>
                      <input
                        className={`${inputClass} flex-1`}
                        list="product-options"
                        value={item.description}
                        onChange={(e) => applyProduct(item.key, e.target.value)}
                        placeholder="ชื่อรายการ — พิมพ์เพื่อค้นจากทะเบียนสินค้า"
                      />
                      <div className="flex shrink-0 items-center">
                        <IconButton title="เลื่อนขึ้น" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                          <path d="m18 15-6-6-6 6" />
                        </IconButton>
                        <IconButton
                          title="เลื่อนลง"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </IconButton>
                        <IconButton
                          title="ลบรายการ"
                          onClick={() => removeItem(item.key)}
                          disabled={items.length === 1}
                          danger
                        >
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_90px_90px_120px_110px]">
                      <input
                        className={`${inputClass} col-span-2 sm:col-span-1`}
                        value={item.detail}
                        onChange={(e) => updateItem(item.key, { detail: e.target.value })}
                        placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                      />
                      <input
                        className={`${inputClass} tnum text-right`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                        placeholder="จำนวน"
                      />
                      <input
                        className={inputClass}
                        value={item.unit}
                        onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                        placeholder="หน่วย"
                      />
                      <input
                        className={`${inputClass} tnum text-right`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.key, { unit_price: e.target.value })}
                        placeholder="ราคา/หน่วย"
                      />
                      <div className="flex items-center justify-end rounded-lg bg-white px-3 py-2.5 text-sm font-semibold tnum text-ink-900 ring-1 ring-ink-200">
                        {money(amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setItems([...items, emptyItem()])}
              className="mt-3 w-full rounded-lg border border-dashed border-ink-300 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            >
              + เพิ่มรายการ
            </button>

            {/* สรุปยอด */}
            <div className="mt-5 space-y-2 border-t border-ink-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">รวมเป็นเงิน</span>
                <span className="tnum font-medium text-ink-900">{money(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-ink-500">ส่วนลด</span>
                <input
                  className={`${inputClass} tnum w-36 text-right`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-between border-t border-ink-200 pt-3 text-base">
                <span className="font-semibold text-ink-900">ยอดสุทธิ</span>
                <span className="tnum text-xl font-bold text-brand-600">{money(totals.total)} ฿</span>
              </div>
            </div>
          </section>

          {/* รายละเอียดเอกสาร */}
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-ink-900">รายละเอียดเอกสาร</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="เลขที่เอกสาร" full>
                <input
                  className={`${inputClass} font-mono`}
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder={
                    mode === 'create'
                      ? `เว้นว่างไว้ ระบบจะออกเลขให้ (เช่น ${
                          docType === 'receipt' ? 'RC' : 'QT'
                        }-${new Date().getFullYear()}-0001)`
                      : 'เว้นว่างไว้เพื่อคงเลขเดิม'
                  }
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  กรอกเองได้ถ้าต้องการใช้เลขของร้าน — ห้ามซ้ำกับเอกสารใบอื่น
                </p>
              </Field>

              <Field label="วันที่ออกเอกสาร">
                <input
                  type="date"
                  className={inputClass}
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </Field>

              {isReceipt ? (
                <>
                  <Field label="วันที่ชำระเงิน">
                    <input
                      type="date"
                      className={inputClass}
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                    />
                  </Field>
                  <Field label="ชำระโดย">
                    <select
                      className={inputClass}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </Field>
                </>
              ) : (
                <Field label="ยืนราคาถึงวันที่">
                  <input
                    type="date"
                    className={inputClass}
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </Field>
              )}

              <Field label="สถานะ">
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocStatus)}
                >
                  {STATUS_OPTIONS[docType].map((s) => (
                    <option key={s} value={s}>{DOC_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </Field>

              {!isReceipt && (
                <Field label="เงื่อนไข (แสดงบนเอกสาร)" full>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </Field>
              )}

              <Field label="หมายเหตุ" full>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ข้อความเพิ่มเติมท้ายเอกสาร"
                />
              </Field>
            </div>
          </section>

          <div className="flex justify-end gap-2 pb-4">
            <button onClick={handleSave} disabled={pending} className={buttonClass('primary')}>
              {pending ? 'กำลังบันทึก…' : 'บันทึกเอกสาร'}
            </button>
          </div>
        </div>

        {/* ================= ตัวอย่างเอกสาร ================= */}
        <div className={`${tab === 'form' ? 'hidden xl:block' : ''}`}>
          <div className="xl:sticky xl:top-6">
            <p className="mb-2 text-xs font-medium tracking-wide text-ink-400">ตัวอย่างก่อนพิมพ์</p>
            <PaperPreview>
              <DocumentPaper doc={previewDoc} shop={shop} />
            </PaperPreview>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  full,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className={labelClass}>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-2 transition-colors disabled:opacity-25 ${
        danger
          ? 'text-ink-400 hover:bg-rose-50 hover:text-rose-600'
          : 'text-ink-400 hover:bg-ink-200 hover:text-ink-700'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
