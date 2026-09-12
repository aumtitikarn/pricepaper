/**
 * ตัวช่วยเรื่องสีของเอกสาร
 *
 * ผู้ใช้เลือกสีแถบเองได้ ซึ่งอาจเป็นสีอ่อนอย่างเหลืองทองของโลโก้ (#f6c145)
 * ถ้าเอาไปวางตัวหนังสือขาวหรือใช้เป็นสีข้อความบนพื้นขาวตรง ๆ จะอ่านไม่ออก
 * ไฟล์นี้จึงคำนวณคู่สีที่อ่านได้ให้อัตโนมัติ ไม่ว่าจะเลือกสีไหนมา
 */

type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return { r: 15, g: 23, b: 42 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** ความสว่างสัมพัทธ์ตามสูตร WCAG */
function luminance({ r, g, b }: RGB): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const INK: RGB = { r: 15, g: 23, b: 42 };

/** สีตัวหนังสือที่อ่านออกเมื่อวางบนพื้นสีนี้ — เหลืองได้ตัวเข้ม น้ำเงินเข้มได้ตัวขาว */
export function textOn(background: string): string {
  const bg = hexToRgb(background);
  return contrast(bg, WHITE) >= contrast(bg, INK) ? '#ffffff' : '#0f172a';
}

/**
 * ปรับสีให้เข้มพอจะเป็น "ตัวหนังสือบนพื้นขาว" ได้ (เป้าหมาย contrast 4.5:1)
 * ค่อย ๆ หรี่ทีละ 6% จนผ่านเกณฑ์ — คงเฉดเดิมไว้ แค่เข้มขึ้น
 */
export function readableOnWhite(color: string): string {
  let rgb = hexToRgb(color);
  for (let i = 0; i < 24 && contrast(rgb, WHITE) < 4.5; i++) {
    rgb = { r: rgb.r * 0.94, g: rgb.g * 0.94, b: rgb.b * 0.94 };
  }
  return rgbToHex(rgb);
}

/** สีเดียวกันแบบจาง ๆ ใช้เป็นพื้นหลังกล่อง */
export function tint(color: string, amount = 0.12): string {
  const { r, g, b } = hexToRgb(color);
  return rgbToHex({
    r: r + (255 - r) * (1 - amount),
    g: g + (255 - g) * (1 - amount),
    b: b + (255 - b) * (1 - amount),
  });
}

/** ชุดสีสำเร็จรูปให้เลือกในหน้าตั้งค่า */
export const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: 'เหลืองทอง (ตามโลโก้)', value: '#f6c145' },
  { label: 'ส้มอิฐ', value: '#ea7317' },
  { label: 'แดงชาด', value: '#dc2626' },
  { label: 'เขียวมรกต', value: '#059669' },
  { label: 'ฟ้าคราม', value: '#0284c7' },
  { label: 'น้ำเงินคราม', value: '#4f46e5' },
  { label: 'ม่วง', value: '#7c3aed' },
  { label: 'เทาเข้ม', value: '#334155' },
];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value;
