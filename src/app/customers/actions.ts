'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db';
import type { Customer } from '@/lib/types';

export type CustomerInput = {
  id?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  note: string;
};

export type CustomerResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

/** ชื่อลูกค้าไม่บังคับ — บางรายมีแต่เบอร์โทรหรือชื่อร้าน เติมทีหลังได้ */
export async function saveCustomer(input: CustomerInput): Promise<CustomerResult> {
  const fields = {
    name: input.name.trim(),
    company: input.company.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    tax_id: input.tax_id.trim(),
    note: input.note.trim(),
  };

  const sql = getSql();

  try {
    const rows = input.id
      ? await sql<Customer[]>`
          update customers set ${sql(fields)} where id = ${input.id} returning *
        `
      : await sql<Customer[]>`
          insert into customers ${sql(fields)} returning *
        `;

    if (!rows[0]) return { ok: false, error: 'ไม่พบลูกค้าที่ต้องการแก้ไข' };

    revalidatePath('/customers');
    return { ok: true, customer: rows[0] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteCustomer(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // เอกสารเดิมยังอยู่ครบ เพราะเก็บ snapshot ชื่อลูกค้าไว้ในตัวเอกสาร
    await getSql()`delete from customers where id = ${id}`;
    revalidatePath('/customers');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
