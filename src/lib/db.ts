// กันพลาด: ถ้าเผลอ import ไฟล์นี้เข้า client component จะ build ไม่ผ่าน
// แทนที่จะปล่อยให้ connection string หลุดไปกับ JS bundle
import 'server-only';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;

/** มีคีย์ครบหรือยัง — ใช้เช็คก่อน query เพื่อขึ้นหน้า "ยังไม่ได้ตั้งค่า" แทนหน้าพัง */
export const isDbConfigured = Boolean(url);

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __shopSql?: Sql };

/**
 * เชื่อมต่อ Supabase Postgres โดยตรงจากฝั่ง server เท่านั้น
 * (ไม่มี key หลุดไปถึงเบราว์เซอร์ — ทุก query วิ่งผ่าน Server Action/Component)
 *
 * เรียกแบบ lazy เพื่อให้หน้า "ยังไม่ได้ตั้งค่า" เปิดได้แม้ยังไม่มี DATABASE_URL
 * และ cache ไว้บน globalThis เพราะ dev server รีโหลดโมดูลบ่อย
 * ถ้าไม่ cache จะเปิด connection ค้างจนพูลเต็ม
 */
export function getSql(): Sql {
  if (globalForDb.__shopSql) return globalForDb.__shopSql;
  if (!url) throw new Error('ยังไม่ได้ตั้งค่า DATABASE_URL ใน .env.local');

  globalForDb.__shopSql = postgres(url, {
    // จำเป็นเพราะ DATABASE_URL ชี้ไปที่ pooler แบบ transaction mode ของ
    // Supabase (พอร์ต 6543) ซึ่งไม่รองรับ prepared statement
    prepare: false,

    max: 10,
    connect_timeout: 10,

    // คืน connection ที่ไม่ได้ใช้ และบังคับรีไซเคิลทุกครึ่งชั่วโมง
    idle_timeout: 20,
    max_lifetime: 60 * 30,

    connection: {
      // กันคิวรีค้างกินช่องพูลถาวร เคยเจอตอน dev ว่าถ้า request ถูกยกเลิกกลางคัน
      // Postgres จะค้างสถานะ ClientRead รอ client ที่ตายไปแล้วจนพูลตัน
      statement_timeout: 15_000,
      idle_in_transaction_session_timeout: 15_000,
    },
  });
  return globalForDb.__shopSql;
}
