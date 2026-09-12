import 'server-only';
import { getSql, isDbConfigured } from './db';
import { DEFAULT_ACCENT } from './color';
import type {
  Customer,
  DocStatus,
  DocType,
  DocumentItem,
  DocumentRecord,
  DocumentWithItems,
  Product,
  ShopSettings,
} from './types';

export { isDbConfigured };

/**
 * postgres.js คืนค่าคอลัมน์ numeric เป็น string เพื่อกันความแม่นยำหาย
 * เอกสารร้านเป็นหลักพัน-หลักหมื่น จึงแปลงเป็น number ตรงนี้ทีเดียว
 * ให้ทุกที่ที่ใช้ต่อได้เลยโดยไม่ต้องระวังชนิดข้อมูล
 */
const n = (v: unknown): number => {
  const num = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
  return Number.isFinite(num) ? num : 0;
};

/** คอลัมน์ date ของ postgres.js กลับมาเป็น Date — เอกสารต้องการแค่ YYYY-MM-DD */
const dateOnly = (v: unknown): string | null => {
  if (!v) return null;
  if (v instanceof Date) {
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  return String(v).slice(0, 10);
};

export const DEFAULT_SETTINGS: ShopSettings = {
  id: 1,
  name: 'ร้านนักเรียนไอที',
  tagline: 'บริการคอมพิวเตอร์และไอทีครบวงจร',
  address: '',
  phone: '064-098-4337',
  email: 'itstudentservice123@gmail.com',
  line_id: '@863icoey',
  tax_id: '',
  logo_url: '/logo.png',
  accent_color: DEFAULT_ACCENT,
  bank_name: '',
  bank_account: '',
  bank_holder: '',
  promptpay: '',
  quotation_terms:
    '• ชำระเงินล่วงหน้า 50%\n• ส่วนที่เหลือชำระเมื่อได้รับสินค้า\n• อาจมีค่าใช้จ่ายเพิ่มเติมเมื่อมีการเปลี่ยนแปลงรายการ',
  receipt_note: 'ขอบคุณที่ใช้บริการครับ',
  updated_at: '',
};

/** ดึงตั้งค่าร้าน — ถ้ายังไม่ได้ตั้งค่า DB หรือ query พัง จะคืนค่าเริ่มต้น
 *  (เรียกจาก layout ทุกหน้า จึงห้ามพังเด็ดขาด) */
export async function getShopSettings(): Promise<ShopSettings> {
  if (!isDbConfigured) return DEFAULT_SETTINGS;
  try {
    const rows = await getSql()<ShopSettings[]>`
      select * from shop_settings where id = 1
    `;
    if (!rows[0]) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...rows[0] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function mapDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    ...(row as unknown as DocumentRecord),
    issue_date: dateOnly(row.issue_date) ?? '',
    valid_until: dateOnly(row.valid_until),
    paid_at: dateOnly(row.paid_at),
    subtotal: n(row.subtotal),
    discount: n(row.discount),
    total: n(row.total),
  };
}

function mapItem(row: Record<string, unknown>): DocumentItem {
  return {
    ...(row as unknown as DocumentItem),
    quantity: n(row.quantity),
    unit_price: n(row.unit_price),
    amount: n(row.amount),
  };
}

export type DocumentFilter = {
  type?: DocType;
  status?: DocStatus;
  search?: string;
  limit?: number;
};

export async function listDocuments(
  filter: DocumentFilter = {}
): Promise<DocumentRecord[]> {
  const sql = getSql();
  const search = filter.search?.trim();

  // เงื่อนไขทุกตัวส่งเป็น parameter — ค้นหาด้วยอักขระพิเศษได้โดยไม่เสี่ยง SQL injection
  const rows = await sql<Record<string, unknown>[]>`
    select * from documents
    where true
      ${filter.type ? sql`and doc_type = ${filter.type}` : sql``}
      ${filter.status ? sql`and status = ${filter.status}` : sql``}
      ${
        search
          ? sql`and (doc_number ilike ${'%' + search + '%'}
                  or customer_name ilike ${'%' + search + '%'}
                  or customer_company ilike ${'%' + search + '%'})`
          : sql``
      }
    order by issue_date desc, doc_number desc
    ${filter.limit ? sql`limit ${filter.limit}` : sql``}
  `;

  return rows.map(mapDocument);
}

export async function getDocument(id: string): Promise<DocumentWithItems | null> {
  const sql = getSql();

  // uuid ที่รูปแบบผิดจะทำให้ Postgres โยน error — ถือว่า "ไม่พบ" ไปเลย
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const [doc] = await sql<Record<string, unknown>[]>`
    select * from documents where id = ${id}
  `;
  if (!doc) return null;

  const items = await sql<Record<string, unknown>[]>`
    select * from document_items where document_id = ${id} order by position
  `;

  return { ...mapDocument(doc), document_items: items.map(mapItem) };
}

/** ใบเสร็จที่ออกจากใบเสนอราคาใบนี้ */
export async function listLinkedDocuments(
  sourceId: string
): Promise<{ id: string; doc_number: string }[]> {
  const sql = getSql();
  return sql<{ id: string; doc_number: string }[]>`
    select id, doc_number from documents
    where source_document_id = ${sourceId}
    order by doc_number
  `;
}

export async function listCustomers(): Promise<Customer[]> {
  const sql = getSql();
  return sql<Customer[]>`select * from customers order by name`;
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  const sql = getSql();
  const rows = await sql<Record<string, unknown>[]>`
    select * from products
    ${includeInactive ? sql`` : sql`where is_active`}
    order by name
  `;
  return rows.map((r) => ({
    ...(r as unknown as Product),
    unit_price: n(r.unit_price),
  }));
}

export type DashboardStats = {
  quotationCount: number;
  receiptCount: number;
  monthRevenue: number;
  monthReceiptCount: number;
  pendingQuotations: number;
  pendingValue: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const sql = getSql();

  // รวมทุกตัวเลขในคำสั่งเดียว — เร็วกว่ายิง 4 รอบ และได้ภาพ ณ เวลาเดียวกัน
  const [row] = await sql<Record<string, unknown>[]>`
    select
      count(*) filter (where doc_type = 'quotation')            as quotation_count,
      count(*) filter (where doc_type = 'receipt')              as receipt_count,
      coalesce(sum(total) filter (
        where doc_type = 'receipt'
          and status <> 'cancelled'
          and issue_date >= date_trunc('month', current_date)
      ), 0)                                                     as month_revenue,
      count(*) filter (
        where doc_type = 'receipt'
          and status <> 'cancelled'
          and issue_date >= date_trunc('month', current_date)
      )                                                         as month_receipt_count,
      count(*) filter (
        where doc_type = 'quotation' and status in ('draft', 'sent')
      )                                                         as pending_quotations,
      coalesce(sum(total) filter (
        where doc_type = 'quotation' and status in ('draft', 'sent')
      ), 0)                                                     as pending_value
    from documents
  `;

  return {
    quotationCount: n(row.quotation_count),
    receiptCount: n(row.receipt_count),
    monthRevenue: n(row.month_revenue),
    monthReceiptCount: n(row.month_receipt_count),
    pendingQuotations: n(row.pending_quotations),
    pendingValue: n(row.pending_value),
  };
}
