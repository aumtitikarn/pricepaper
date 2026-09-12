export type DocType = 'quotation' | 'receipt';

export type DocStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export type ShopSettings = {
  id: number;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  line_id: string;
  tax_id: string;
  logo_url: string;
  /** สีแถบ/หัวตารางบนเอกสาร เก็บเป็น hex เช่น "#f6c145" */
  accent_color: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  promptpay: string;
  quotation_terms: string;
  receipt_note: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentItem = {
  id: string;
  document_id: string;
  position: number;
  description: string;
  detail: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type DocumentRecord = {
  id: string;
  doc_type: DocType;
  doc_number: string;
  status: DocStatus;
  issue_date: string;
  valid_until: string | null;
  customer_id: string | null;
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
  source_document_id: string | null;
  notes: string;
  terms: string;
  created_at: string;
  updated_at: string;
};

export type DocumentWithItems = DocumentRecord & {
  document_items: DocumentItem[];
};

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  quotation: 'ใบเสนอราคา',
  receipt: 'ใบเสร็จรับเงิน',
};

export const DOC_TYPE_LABEL_EN: Record<DocType, string> = {
  quotation: 'QUOTATION',
  receipt: 'RECEIPT',
};

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งให้ลูกค้าแล้ว',
  accepted: 'ลูกค้าตอบรับ',
  rejected: 'ลูกค้าปฏิเสธ',
  paid: 'ชำระเงินแล้ว',
  cancelled: 'ยกเลิก',
};

/** สถานะที่เลือกได้ แยกตามชนิดเอกสาร */
export const STATUS_OPTIONS: Record<DocType, DocStatus[]> = {
  quotation: ['draft', 'sent', 'accepted', 'rejected', 'cancelled'],
  receipt: ['paid', 'cancelled'],
};

export const PAYMENT_METHODS = [
  'เงินสด',
  'โอนเงิน',
  'พร้อมเพย์',
  'บัตรเครดิต',
  'อื่น ๆ',
] as const;
