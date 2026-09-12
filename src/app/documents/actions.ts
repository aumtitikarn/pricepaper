'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSql } from '@/lib/db';
import { getDocument } from '@/lib/data';
import type { DocStatus, DocType } from '@/lib/types';

export type DocumentPayload = {
  id?: string;
  /** เลขที่เอกสารที่กรอกเอง — เว้นว่างไว้ระบบจะออกเลขให้ตอนบันทึก */
  doc_number?: string;
  doc_type: DocType;
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
  discount: number;
  payment_method: string;
  paid_at: string | null;
  source_document_id: string | null;
  notes: string;
  terms: string;
  /** บันทึกลูกค้ารายนี้เข้าทะเบียนไปพร้อมกัน (เฉพาะตอนยังไม่ได้เลือกจากทะเบียน) */
  save_customer?: boolean;
  items: {
    description: string;
    detail: string;
    unit: string;
    quantity: number;
    unit_price: number;
  }[];
};

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

const round2 = (v: number) => Math.round((Number(v) || 0) * 100) / 100;

/**
 * คำนวณยอดเงินฝั่ง server เสมอ ไม่เชื่อตัวเลขรวมที่ส่งมาจาก client
 * เพื่อไม่ให้เอกสารที่บันทึกไว้มียอดไม่ตรงกับรายการ
 */
function computeTotals(payload: DocumentPayload) {
  const items = payload.items
    .filter((it) => it.description.trim() !== '' || Number(it.unit_price) !== 0)
    .map((it, i) => {
      const quantity = round2(it.quantity);
      const unit_price = round2(it.unit_price);
      return {
        position: i,
        description: it.description.trim(),
        detail: it.detail?.trim() ?? '',
        unit: it.unit?.trim() ?? '',
        quantity,
        unit_price,
        amount: round2(quantity * unit_price),
      };
    });

  const subtotal = round2(items.reduce((s, it) => s + it.amount, 0));
  const discount = Math.min(Math.max(round2(payload.discount), 0), subtotal);
  const total = round2(subtotal - discount);

  return { items, subtotal, discount, total };
}

export async function saveDocument(payload: DocumentPayload): Promise<ActionResult> {
  if (!payload.customer_name.trim()) {
    return { ok: false, error: 'กรุณากรอกชื่อลูกค้า' };
  }

  const { items, subtotal, discount, total } = computeTotals(payload);
  if (items.length === 0) {
    return { ok: false, error: 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ' };
  }

  const isReceipt = payload.doc_type === 'receipt';
  const fields = {
    doc_type: payload.doc_type,
    status: payload.status,
    issue_date: payload.issue_date,
    valid_until: isReceipt ? null : payload.valid_until || null,
    customer_id: payload.customer_id,
    customer_name: payload.customer_name.trim(),
    customer_company: payload.customer_company.trim(),
    customer_phone: payload.customer_phone.trim(),
    customer_email: payload.customer_email.trim(),
    customer_address: payload.customer_address.trim(),
    customer_tax_id: payload.customer_tax_id.trim(),
    subtotal,
    discount,
    total,
    payment_method: isReceipt ? payload.payment_method : '',
    paid_at: isReceipt ? payload.paid_at || null : null,
    source_document_id: payload.source_document_id,
    notes: payload.notes,
    terms: payload.terms,
  };

  const sql = getSql();

  try {
    // ทั้งหัวเอกสารและรายการต้องลงพร้อมกัน ไม่งั้นอาจได้เอกสารที่ไม่มีรายการ
    const documentId = await sql.begin(async (tx) => {
      let id = payload.id;

      // เพิ่มลูกค้าเข้าทะเบียนในทรานแซกชันเดียวกัน — ทำที่นี่แทนที่จะให้ฝั่ง
      // client ยิง action แยกอีกตัว เพราะ server action สองตัวใน transition
      // เดียวกันจะทำให้ router.push ค้าง (ปุ่มบันทึกหมุนไม่จบ)
      if (payload.save_customer && !fields.customer_id) {
        const [customer] = await tx<{ id: string }[]>`
          insert into customers ${tx({
            name: fields.customer_name,
            company: fields.customer_company,
            phone: fields.customer_phone,
            email: fields.customer_email,
            address: fields.customer_address,
            tax_id: fields.customer_tax_id,
          })}
          returning id
        `;
        fields.customer_id = customer.id;
      }

      // เลขที่กรอกเองมาก่อนเสมอ ถ้าเว้นว่างค่อยให้ฐานข้อมูลออกเลขให้
      const manualNumber = payload.doc_number?.trim() ?? '';

      if (id) {
        // แก้ไข: เว้นเลขที่ว่างไว้ = คงเลขเดิม ไม่ออกเลขใหม่
        const withNumber = manualNumber
          ? { ...fields, doc_number: manualNumber }
          : fields;

        const updated = await tx<{ id: string }[]>`
          update documents set ${tx(withNumber)} where id = ${id} returning id
        `;
        if (updated.length === 0) throw new Error('ไม่พบเอกสารที่ต้องการแก้ไข');

        // แทนที่รายการทั้งชุด — ง่ายและตรงกว่าการ diff ทีละแถว
        await tx`delete from document_items where document_id = ${id}`;
      } else {
        let docNumber = manualNumber;
        if (!docNumber) {
          const [generated] = await tx<{ next_doc_number: string }[]>`
            select next_doc_number(${payload.doc_type}::doc_type)
          `;
          docNumber = generated.next_doc_number;
        }

        const [created] = await tx<{ id: string }[]>`
          insert into documents ${tx({ ...fields, doc_number: docNumber })}
          returning id
        `;
        id = created.id;
      }

      await tx`
        insert into document_items ${tx(
          items.map((it) => ({ ...it, document_id: id as string }))
        )}
      `;

      return id as string;
    });

    revalidatePath('/documents');
    revalidatePath(`/documents/${documentId}`);
    revalidatePath('/customers');
    revalidatePath('/');
    return { ok: true, id: documentId };
  } catch (e) {
    // 23505 = unique_violation — เกิดตอนกรอกเลขที่ซ้ำกับเอกสารที่มีอยู่
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === '23505') {
      return {
        ok: false,
        error: `เลขที่ "${payload.doc_number?.trim()}" ถูกใช้กับเอกสารอื่นแล้ว กรุณาใช้เลขอื่น หรือเว้นว่างให้ระบบออกเลขให้`,
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateStatus(id: string, status: DocStatus) {
  await getSql()`update documents set status = ${status} where id = ${id}`;
  revalidatePath('/documents');
  revalidatePath(`/documents/${id}`);
  revalidatePath('/');
}

export async function deleteDocument(id: string) {
  // document_items ถูกลบตาม cascade ที่ตั้งไว้ใน schema
  await getSql()`delete from documents where id = ${id}`;
  revalidatePath('/documents');
  revalidatePath('/');
  redirect('/documents');
}

/**
 * สร้างใบเสร็จรับเงินจากใบเสนอราคา — คัดลอกลูกค้าและรายการทั้งหมดมา
 * แล้วพาไปหน้าใบเสร็จที่สร้างใหม่
 */
export async function convertToReceipt(quotationId: string) {
  const source = await getDocument(quotationId);
  if (!source) throw new Error('ไม่พบใบเสนอราคาต้นทาง');
  if (source.doc_type !== 'quotation') throw new Error('เอกสารนี้ไม่ใช่ใบเสนอราคา');

  const today = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const result = await saveDocument({
    doc_type: 'receipt',
    status: 'paid',
    issue_date: todayISO,
    valid_until: null,
    customer_id: source.customer_id,
    customer_name: source.customer_name,
    customer_company: source.customer_company,
    customer_phone: source.customer_phone,
    customer_email: source.customer_email,
    customer_address: source.customer_address,
    customer_tax_id: source.customer_tax_id,
    discount: source.discount,
    payment_method: 'เงินสด',
    paid_at: todayISO,
    source_document_id: source.id,
    notes: '',
    terms: '',
    items: source.document_items.map((it) => ({
      description: it.description,
      detail: it.detail,
      unit: it.unit,
      quantity: it.quantity,
      unit_price: it.unit_price,
    })),
  });

  if (!result.ok) throw new Error(result.error);

  // ทำเครื่องหมายว่าใบเสนอราคานี้ลูกค้าตอบรับแล้ว
  await getSql()`update documents set status = 'accepted' where id = ${quotationId}`;
  revalidatePath(`/documents/${quotationId}`);

  redirect(`/documents/${result.id}`);
}
