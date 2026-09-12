-- ============================================================
--  ปิดประตูหลัง: ห้าม REST API ของ Supabase แตะข้อมูลร้าน
--  รันไฟล์นี้ต่อจาก schema.sql (รันซ้ำได้ ไม่มีผลข้างเคียง)
--
--  ทำไมต้องรัน:
--    Supabase ให้สิทธิ์ role `anon` แบบเต็ม (SELECT/INSERT/UPDATE/DELETE)
--    กับทุกตารางใน schema public โดยอัตโนมัติ และ RLS ปิดมาแต่แรก
--    anon key เป็นค่าสาธารณะที่ใครก็อ่านได้ ถ้าไม่ปิด = ใครก็ลบข้อมูลทั้งร้านได้
--
--  เว็บนี้ต่อฐานข้อมูลตรงด้วย role `postgres` ฝั่ง server เท่านั้น
--  จึงไม่ต้องใช้สิทธิ์ของ anon เลย
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'shop_settings','customers','products','documents','document_items','document_counters'
  ] loop
    -- 1) ยึดสิทธิ์คืนจาก role ที่ REST API ใช้
    execute format('revoke all on public.%I from anon, authenticated', t);

    -- 2) เปิด RLS โดยไม่สร้าง policy ใด ๆ = ปฏิเสธทุกคำขอที่ไม่ใช่ superuser
    --    (role postgres ที่เว็บใช้ bypass RLS ได้ จึงทำงานได้ตามปกติ)
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('alter table public.%I no force row level security', t);
  end loop;
end $$;

revoke execute on function public.next_doc_number(public.doc_type) from anon, authenticated;

-- กันตารางที่สร้างใหม่ในอนาคตไม่ให้ได้สิทธิ์ anon อัตโนมัติ
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
