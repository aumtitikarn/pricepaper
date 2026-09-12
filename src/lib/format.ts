/** จัดรูปแบบตัวเลขเงิน: 1234.5 -> "1,234.50" */
export function money(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n ?? 0;
  const safe = Number.isFinite(v) ? (v as number) : 0;
  return safe.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** จัดรูปแบบจำนวน: 1 -> "1", 1.5 -> "1.5" */
export function qty(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n ?? 0;
  const safe = Number.isFinite(v) ? (v as number) : 0;
  return safe.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/**
 * แปลง "YYYY-MM-DD" เป็นวันที่ไทย พ.ศ.
 * parse เองแทน new Date() เพื่อเลี่ยงปัญหา timezone เลื่อนวัน
 */
export function thaiDate(
  iso: string | null | undefined,
  style: 'full' | 'short' = 'full'
): string {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '-';
  const months = style === 'full' ? TH_MONTHS_FULL : TH_MONTHS_SHORT;
  return `${d} ${months[m - 1]} ${y + 543}`;
}

/** วันที่วันนี้ในรูปแบบ "YYYY-MM-DD" ตามเวลาเครื่อง (ไม่ใช่ UTC) */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** บวกวันจากวันที่ ISO คืนค่าเป็น ISO */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

const BAHT_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const BAHT_PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

/** อ่านจำนวนเต็ม (สูงสุดหลักล้าน ๆ) เป็นคำไทย */
function readInteger(numStr: string): string {
  // ตัวเลขยาวเกิน 7 หลัก: ตัดส่วนหน้าออกมาอ่านแล้วต่อท้ายด้วย "ล้าน"
  if (numStr.length > 7) {
    const head = numStr.slice(0, numStr.length - 6);
    const tail = numStr.slice(numStr.length - 6);
    const tailRead = tail === '000000' ? '' : readInteger(tail.replace(/^0+/, '') || '0');
    return readInteger(head) + 'ล้าน' + (tailRead === 'ศูนย์' ? '' : tailRead);
  }

  let out = '';
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(numStr[i]);
    const place = len - i - 1;
    if (digit === 0) continue;

    if (place === 0 && digit === 1 && len > 1) {
      out += 'เอ็ด';
    } else if (place === 1 && digit === 1) {
      out += 'สิบ';
    } else if (place === 1 && digit === 2) {
      out += 'ยี่สิบ';
    } else {
      out += BAHT_DIGITS[digit] + BAHT_PLACES[place];
    }
  }
  return out || 'ศูนย์';
}

/**
 * แปลงจำนวนเงินเป็นตัวหนังสือไทย
 * 1250.75 -> "หนึ่งพันสองร้อยห้าสิบบาทเจ็ดสิบห้าสตางค์"
 */
export function bahtText(amount: number | string | null | undefined): string {
  const raw = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  const value = Number.isFinite(raw) ? (raw as number) : 0;
  const negative = value < 0;

  // ปัดเป็นสตางค์ก่อน เพื่อไม่ให้ floating point ทำให้ 0.29 กลายเป็น 28 สตางค์
  const totalSatang = Math.round(Math.abs(value) * 100);
  const baht = Math.floor(totalSatang / 100);
  const satang = totalSatang % 100;

  const bahtWords = readInteger(String(baht)) + 'บาท';
  const tail = satang === 0 ? 'ถ้วน' : readInteger(String(satang)) + 'สตางค์';

  return (negative ? 'ลบ' : '') + bahtWords + tail;
}
