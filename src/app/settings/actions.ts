'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db';
import type { ShopSettings } from '@/lib/types';

export type SettingsInput = Omit<ShopSettings, 'id' | 'updated_at'>;

export async function saveSettings(
  input: SettingsInput
): Promise<{ ok: boolean; error?: string }> {
  if (!input.name.trim()) return { ok: false, error: 'กรุณากรอกชื่อร้าน' };

  const fields = { ...input, name: input.name.trim() };
  const sql = getSql();

  try {
    await sql`
      insert into shop_settings ${sql({ ...fields, id: 1 })}
      on conflict (id) do update set ${sql(fields)}
    `;

    // ชื่อร้าน/โลโก้ไปโผล่ในทุกหน้า จึงล้าง cache ทั้งเว็บ
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
