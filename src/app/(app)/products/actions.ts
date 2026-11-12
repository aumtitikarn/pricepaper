'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db';
import type { Product } from '@/lib/types';

export type ProductInput = {
  id?: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  category: string;
  is_active: boolean;
};

export type ProductResult =
  | { ok: true; product: Product }
  | { ok: false; error: string };

export async function saveProduct(input: ProductInput): Promise<ProductResult> {
  if (!input.name.trim()) return { ok: false, error: 'กรุณากรอกชื่อสินค้า/บริการ' };

  const price = Math.round((Number(input.unit_price) || 0) * 100) / 100;
  const fields = {
    name: input.name.trim(),
    description: input.description.trim(),
    unit: input.unit.trim() || 'ชิ้น',
    unit_price: price < 0 ? 0 : price,
    category: input.category.trim(),
    is_active: input.is_active,
  };

  const sql = getSql();

  try {
    const rows = input.id
      ? await sql<Product[]>`
          update products set ${sql(fields)} where id = ${input.id} returning *
        `
      : await sql<Product[]>`
          insert into products ${sql(fields)} returning *
        `;

    if (!rows[0]) return { ok: false, error: 'ไม่พบรายการที่ต้องการแก้ไข' };

    revalidatePath('/products');
    return { ok: true, product: { ...rows[0], unit_price: Number(rows[0].unit_price) } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await getSql()`delete from products where id = ${id}`;
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
