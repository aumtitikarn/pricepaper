import { bahtText, money, qty, thaiDate } from '@/lib/format';
import { DEFAULT_ACCENT, readableOnWhite, textOn, tint } from '@/lib/color';
import type { DocType, ShopSettings } from '@/lib/types';
import { DOC_TYPE_LABEL, DOC_TYPE_LABEL_EN } from '@/lib/types';

export type PaperItem = {
  description: string;
  detail: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type PaperDoc = {
  doc_type: DocType;
  doc_number: string;
  issue_date: string;
  valid_until: string | null;
  customer_name: string;
  customer_company: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_tax_id: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  paid_at: string | null;
  notes: string;
  terms: string;
  items: PaperItem[];
};

const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

/**
 * เอกสาร A4 พร้อมพิมพ์
 * ใช้ inline style กับสี/เส้นเป็นหลัก เพื่อให้ผลลัพธ์ตอนพิมพ์
 * ไม่เพี้ยนตามการตั้งค่าเบราว์เซอร์
 */
export default function DocumentPaper({
  doc,
  shop,
}: {
  doc: PaperDoc;
  shop: ShopSettings;
}) {
  const isReceipt = doc.doc_type === 'receipt';
  const minRows = Math.max(0, 6 - doc.items.length);

  // สีแถบเลือกเองได้ จึงต้องหาคู่สีที่อ่านออกเสมอ:
  // BRAND ใช้กับพื้น, ON_BRAND คือสีตัวหนังสือบนพื้นนั้น
  // ACCENT_TEXT คือเฉดเดียวกันที่เข้มพอจะเป็นตัวหนังสือบนกระดาษขาว
  const BRAND = doc_accent(shop);
  const ON_BRAND = textOn(BRAND);
  const ACCENT_TEXT = readableOnWhite(BRAND);
  const SOFT = tint(BRAND, 0.1);

  return (
    <article className="paper relative flex flex-col text-[13px] leading-relaxed">
      {/* แถบสีหัวกระดาษ */}
      <div
        className="absolute inset-x-0 top-0 h-[6mm]"
        style={{ background: BRAND }}
        aria-hidden
      />

      {/* ---------- หัวเอกสาร ---------- */}
      <header className="flex items-start justify-between gap-6 pt-[6mm]">
        <div className="flex items-start gap-3">
          {shop.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shop.logo_url}
              alt=""
              className="h-[18mm] w-[18mm] shrink-0 object-contain"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold leading-tight" style={{ color: INK }}>
              {shop.name}
            </h2>
            {shop.tagline && (
              <p className="text-[11px]" style={{ color: MUTED }}>
                {shop.tagline}
              </p>
            )}
            <div className="mt-1.5 space-y-[1px] text-[11px]" style={{ color: MUTED }}>
              {shop.address && <p className="whitespace-pre-line">{shop.address}</p>}
              {shop.phone && <p>โทร. {shop.phone}</p>}
              {shop.email && <p>{shop.email}</p>}
              {shop.line_id && <p>LINE {shop.line_id}</p>}
              {shop.tax_id && <p>เลขประจำตัวผู้เสียภาษี {shop.tax_id}</p>}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <h1 className="text-[24px] font-bold leading-none" style={{ color: ACCENT_TEXT }}>
            {DOC_TYPE_LABEL[doc.doc_type]}
          </h1>
          <p className="mt-0.5 text-[10px] font-medium tracking-[0.2em]" style={{ color: MUTED }}>
            {DOC_TYPE_LABEL_EN[doc.doc_type]}
          </p>
          <table className="mt-3 ml-auto text-[11.5px]">
            <tbody>
              <Meta label="เลขที่" value={doc.doc_number || '(ออกเลขเมื่อบันทึก)'} bold />
              <Meta label="วันที่" value={thaiDate(doc.issue_date)} />
              {isReceipt ? (
                <>
                  {doc.paid_at && <Meta label="วันที่ชำระ" value={thaiDate(doc.paid_at)} />}
                  {doc.payment_method && <Meta label="ชำระโดย" value={doc.payment_method} />}
                </>
              ) : (
                doc.valid_until && <Meta label="ยืนราคาถึง" value={thaiDate(doc.valid_until)} />
              )}
            </tbody>
          </table>
        </div>
      </header>

      {/* ---------- ลูกค้า ---------- */}
      <section
        className="mt-[7mm] rounded-md px-4 py-3"
        style={{ background: SOFT, border: `1px solid ${LINE}` }}
      >
        <p className="text-[10px] font-semibold tracking-wider" style={{ color: ACCENT_TEXT }}>
          {isReceipt ? 'ได้รับเงินจาก' : 'เสนอราคาให้'}
        </p>
        <p className="mt-1 text-[14px] font-semibold" style={{ color: INK }}>
          {doc.customer_company || doc.customer_name || '-'}
        </p>
        {doc.customer_company && doc.customer_name && (
          <p className="text-[11.5px]" style={{ color: MUTED }}>
            คุณ{doc.customer_name}
          </p>
        )}
        <div className="mt-1 space-y-[1px] text-[11.5px]" style={{ color: MUTED }}>
          {doc.customer_address && <p className="whitespace-pre-line">{doc.customer_address}</p>}
          {(doc.customer_phone || doc.customer_email) && (
            <p>{[doc.customer_phone && `โทร. ${doc.customer_phone}`, doc.customer_email].filter(Boolean).join('  •  ')}</p>
          )}
          {doc.customer_tax_id && <p>เลขประจำตัวผู้เสียภาษี {doc.customer_tax_id}</p>}
        </div>
      </section>

      {/* ---------- ตารางรายการ ---------- */}
      <table className="mt-[6mm] w-full border-collapse text-[12px]">
        <thead>
          <tr style={{ background: BRAND, color: ON_BRAND }}>
            <th className="w-[11mm] px-2 py-2 text-center font-semibold">ลำดับ</th>
            <th className="px-3 py-2 text-left font-semibold">รายการ</th>
            <th className="w-[20mm] px-2 py-2 text-center font-semibold">จำนวน</th>
            <th className="w-[26mm] px-2 py-2 text-right font-semibold">หน่วยละ</th>
            <th className="w-[30mm] px-3 py-2 text-right font-semibold">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td className="px-2 py-2 text-center align-top tnum" style={{ color: MUTED }}>
                {i + 1}
              </td>
              <td className="px-3 py-2 align-top">
                <span style={{ color: INK }}>{item.description}</span>
                {item.detail && (
                  <span className="mt-0.5 block whitespace-pre-line text-[11px]" style={{ color: MUTED }}>
                    {item.detail}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 text-center align-top tnum" style={{ color: INK }}>
                {qty(item.quantity)}
                {item.unit && <span style={{ color: MUTED }}> {item.unit}</span>}
              </td>
              <td className="px-2 py-2 text-right align-top tnum" style={{ color: INK }}>
                {money(item.unit_price)}
              </td>
              <td className="px-3 py-2 text-right align-top tnum font-medium" style={{ color: INK }}>
                {money(item.amount)}
              </td>
            </tr>
          ))}

          {/* แถวเปล่าให้ตารางดูเต็มหน้า */}
          {Array.from({ length: minRows }).map((_, i) => (
            <tr key={`blank-${i}`} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td className="px-2 py-2">&nbsp;</td>
              <td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- สรุปยอด ---------- */}
      <section className="mt-[5mm] flex items-start justify-between gap-6 avoid-break">
        <div
          className="flex-1 rounded-md px-4 py-3"
          style={{ border: `1px dashed ${LINE}`, background: SOFT }}
        >
          <p className="text-[10px] font-semibold tracking-wider" style={{ color: MUTED }}>
            จำนวนเงินรวมทั้งสิ้น (ตัวอักษร)
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: INK }}>
            ({bahtText(doc.total)})
          </p>
        </div>

        <table className="w-[70mm] shrink-0 text-[12px]">
          <tbody>
            <tr>
              <td className="py-1 pr-3 text-right" style={{ color: MUTED }}>รวมเป็นเงิน</td>
              <td className="py-1 text-right tnum" style={{ color: INK }}>{money(doc.subtotal)}</td>
            </tr>
            {doc.discount > 0 && (
              <tr>
                <td className="py-1 pr-3 text-right" style={{ color: MUTED }}>ส่วนลด</td>
                <td className="py-1 text-right tnum" style={{ color: '#e11d48' }}>-{money(doc.discount)}</td>
              </tr>
            )}
            <tr>
              <td
                className="py-2 pr-3 text-right text-[13px] font-bold"
                style={{ color: INK, borderTop: `1.5px solid ${ACCENT_TEXT}` }}
              >
                {isReceipt ? 'ยอดชำระ' : 'ยอดสุทธิ'}
              </td>
              <td
                className="py-2 text-right text-[15px] font-bold tnum"
                style={{ color: ACCENT_TEXT, borderTop: `1.5px solid ${ACCENT_TEXT}` }}
              >
                {money(doc.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- ท้ายเอกสาร ---------- */}
      <footer className="mt-auto pt-[7mm] avoid-break">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3 text-[11px]">
            {!isReceipt && doc.terms && (
              <div>
                <p className="font-semibold" style={{ color: INK }}>เงื่อนไข</p>
                <p className="whitespace-pre-line" style={{ color: MUTED }}>{doc.terms}</p>
              </div>
            )}
            {!isReceipt && (shop.bank_name || shop.promptpay) && (
              <div>
                <p className="font-semibold" style={{ color: INK }}>ช่องทางชำระเงิน</p>
                <div style={{ color: MUTED }}>
                  {shop.bank_name && (
                    <p>
                      {shop.bank_name} {shop.bank_account}
                      {shop.bank_holder && ` (${shop.bank_holder})`}
                    </p>
                  )}
                  {shop.promptpay && <p>พร้อมเพย์ {shop.promptpay}</p>}
                </div>
              </div>
            )}
            {doc.notes && (
              <div>
                <p className="font-semibold" style={{ color: INK }}>หมายเหตุ</p>
                <p className="whitespace-pre-line" style={{ color: MUTED }}>{doc.notes}</p>
              </div>
            )}
            {isReceipt && shop.receipt_note && (
              <p className="text-[12px] font-medium" style={{ color: ACCENT_TEXT }}>{shop.receipt_note}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 self-end pt-8 text-center text-[11px]">
            <Signature label={isReceipt ? 'ผู้จ่ายเงิน' : 'ผู้อนุมัติสั่งซื้อ'} />
            <Signature label={isReceipt ? 'ผู้รับเงิน' : 'ผู้เสนอราคา'} />
          </div>
        </div>

        <p className="mt-[6mm] text-center text-[9.5px]" style={{ color: '#94a3b8' }}>
          เอกสารนี้ออกโดยระบบของ {shop.name}
          {doc.doc_number && ` · ${doc.doc_number}`}
        </p>
      </footer>
    </article>
  );
}

/** เผื่อฐานข้อมูลเก่าที่ยังไม่มีคอลัมน์ accent_color */
function doc_accent(shop: ShopSettings): string {
  const value = (shop.accent_color ?? '').trim();
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : DEFAULT_ACCENT;
}

function Meta({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="py-[2px] pr-3 text-right whitespace-nowrap" style={{ color: MUTED }}>
        {label}
      </td>
      <td
        className="py-[2px] text-right whitespace-nowrap"
        style={{ color: INK, fontWeight: bold ? 600 : 400 }}
      >
        {value}
      </td>
    </tr>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1.5 h-[10mm]" />
      <div style={{ borderTop: `1px dotted ${MUTED}` }} />
      <p className="mt-1" style={{ color: MUTED }}>{label}</p>
      <p className="text-[10px]" style={{ color: '#94a3b8' }}>วันที่ ......./......./.......</p>
    </div>
  );
}
