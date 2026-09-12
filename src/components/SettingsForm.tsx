'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPaper from './DocumentPaper';
import PaperPreview from './PaperPreview';
import { saveSettings, type SettingsInput } from '@/app/settings/actions';
import { buttonClass, inputClass, labelClass } from './ui';
import { todayISO, addDaysISO } from '@/lib/format';
import { ACCENT_PRESETS, DEFAULT_ACCENT, readableOnWhite, textOn } from '@/lib/color';
import type { ShopSettings } from '@/lib/types';

export default function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SettingsInput>({
    name: settings.name,
    tagline: settings.tagline ?? '',
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    line_id: settings.line_id ?? '',
    tax_id: settings.tax_id ?? '',
    logo_url: settings.logo_url ?? '',
    accent_color: settings.accent_color || DEFAULT_ACCENT,
    bank_name: settings.bank_name ?? '',
    bank_account: settings.bank_account ?? '',
    bank_holder: settings.bank_holder ?? '',
    promptpay: settings.promptpay ?? '',
    quotation_terms: settings.quotation_terms ?? '',
    receipt_note: settings.receipt_note ?? '',
  });

  const set = (patch: Partial<SettingsInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveSettings(form);
      if (!result.ok) {
        setError(result.error ?? 'บันทึกไม่สำเร็จ');
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  // minmax(0,1fr) จำเป็น — ไม่งั้น grid track จะโตตามกระดาษ 794px แล้วหน้าจะล้นแนวนอนบนมือถือ
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="space-y-5">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-ink-900">ข้อมูลร้าน</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อร้าน" required>
              <input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="คำโปรย">
              <input
                className={inputClass}
                value={form.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                placeholder="บริการคอมพิวเตอร์และไอทีครบวงจร"
              />
            </Field>
            <Field label="ที่อยู่" full>
              <textarea
                className={inputClass}
                rows={2}
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
              />
            </Field>
            <Field label="เบอร์โทร">
              <input className={inputClass} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="อีเมล">
              <input className={inputClass} value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="LINE ID">
              <input className={inputClass} value={form.line_id} onChange={(e) => set({ line_id: e.target.value })} />
            </Field>
            <Field label="เลขประจำตัวผู้เสียภาษี">
              <input className={inputClass} value={form.tax_id} onChange={(e) => set({ tax_id: e.target.value })} />
            </Field>
            <Field label="โลโก้ (path ในโฟลเดอร์ public หรือ URL เต็ม)" full>
              <input
                className={inputClass}
                value={form.logo_url}
                onChange={(e) => set({ logo_url: e.target.value })}
                placeholder="/logo.png"
              />
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-semibold text-ink-900">สีแถบบนเอกสาร</h2>
          <p className="mb-4 text-sm text-ink-500">
            ใช้กับแถบหัวกระดาษ หัวตาราง และยอดสุทธิ — ตัวอย่างด้านขวาเปลี่ยนตามทันที
          </p>

          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const active = form.accent_color.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  aria-label={preset.label}
                  aria-pressed={active}
                  onClick={() => set({ accent_color: preset.value })}
                  className={`h-10 w-10 rounded-lg transition-transform hover:scale-105 ${
                    active ? 'ring-2 ring-ink-900 ring-offset-2' : 'ring-1 ring-ink-200'
                  }`}
                  style={{ background: preset.value }}
                >
                  {active && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={textOn(preset.value)}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className={labelClass}>เลือกสีเอง</label>
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => set({ accent_color: e.target.value })}
                className="h-11 w-20 cursor-pointer rounded-lg border border-ink-300 bg-white p-1"
              />
            </div>
            <div>
              <label className={labelClass}>รหัสสี</label>
              <input
                className={`${inputClass} w-32 font-mono uppercase`}
                value={form.accent_color}
                onChange={(e) => {
                  const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                  set({ accent_color: v.slice(0, 7) });
                }}
                placeholder={DEFAULT_ACCENT}
              />
            </div>
            <p className="pb-3 text-xs text-ink-400">
              สีอ่อนอย่างเหลืองจะถูกปรับให้เข้มขึ้นเองตอนใช้เป็นตัวหนังสือ
              <br />
              เพื่อให้อ่านออกทั้งบนจอและตอนพิมพ์ ({readableOnWhite(form.accent_color)})
            </p>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-semibold text-ink-900">ช่องทางรับเงิน</h2>
          <p className="mb-4 text-sm text-ink-500">แสดงท้ายใบเสนอราคา เพื่อให้ลูกค้าโอนได้เลย</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ธนาคาร">
              <input
                className={inputClass}
                value={form.bank_name}
                onChange={(e) => set({ bank_name: e.target.value })}
                placeholder="กสิกรไทย"
              />
            </Field>
            <Field label="เลขที่บัญชี">
              <input
                className={inputClass}
                value={form.bank_account}
                onChange={(e) => set({ bank_account: e.target.value })}
              />
            </Field>
            <Field label="ชื่อบัญชี">
              <input
                className={inputClass}
                value={form.bank_holder}
                onChange={(e) => set({ bank_holder: e.target.value })}
              />
            </Field>
            <Field label="พร้อมเพย์">
              <input
                className={inputClass}
                value={form.promptpay}
                onChange={(e) => set({ promptpay: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-semibold text-ink-900">ข้อความตั้งต้น</h2>
          <p className="mb-4 text-sm text-ink-500">
            เติมให้อัตโนมัติตอนสร้างเอกสารใหม่ แก้รายฉบับได้ภายหลัง
          </p>
          <div className="space-y-4">
            <Field label="เงื่อนไขในใบเสนอราคา" full>
              <textarea
                className={inputClass}
                rows={4}
                value={form.quotation_terms}
                onChange={(e) => set({ quotation_terms: e.target.value })}
              />
            </Field>
            <Field label="ข้อความท้ายใบเสร็จ" full>
              <input
                className={inputClass}
                value={form.receipt_note}
                onChange={(e) => set({ receipt_note: e.target.value })}
                placeholder="ขอบคุณที่ใช้บริการครับ"
              />
            </Field>
          </div>
        </section>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-4">
          {saved && <span className="text-sm font-medium text-emerald-600">บันทึกแล้ว ✓</span>}
          <button className={buttonClass('primary')} onClick={submit} disabled={pending}>
            {pending ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>

      {/* ตัวอย่างเอกสารที่ใช้ข้อมูลจริงจากฟอร์ม */}
      <div>
        <div className="xl:sticky xl:top-6">
          <p className="mb-2 text-xs font-medium tracking-wide text-ink-400">ตัวอย่างเอกสาร</p>
          <PaperPreview>
            <DocumentPaper
              shop={{ ...settings, ...form }}
              doc={{
                doc_type: 'quotation',
                doc_number: `QT-${new Date().getFullYear()}-0001`,
                issue_date: todayISO(),
                valid_until: addDaysISO(todayISO(), 14),
                customer_name: 'สมชาย ใจดี',
                customer_company: '',
                customer_phone: '081-234-5678',
                customer_email: '',
                customer_address: '',
                customer_tax_id: '',
                subtotal: 4500,
                discount: 500,
                total: 4000,
                payment_method: '',
                paid_at: null,
                notes: '',
                terms: form.quotation_terms,
                items: [
                  {
                    description: 'ประกอบคอมพิวเตอร์ตั้งโต๊ะ',
                    detail: 'ตรวจเช็กอุปกรณ์ + จัดสายไฟ',
                    unit: 'เครื่อง',
                    quantity: 1,
                    unit_price: 3000,
                    amount: 3000,
                  },
                  {
                    description: 'ลงวินโดวส์ + ไดรเวอร์ครบ',
                    detail: '',
                    unit: 'งาน',
                    quantity: 1,
                    unit_price: 1500,
                    amount: 1500,
                  },
                ],
              }}
            />
          </PaperPreview>
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
