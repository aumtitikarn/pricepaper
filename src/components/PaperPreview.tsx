'use client';

import { useEffect, useRef, useState } from 'react';

const A4_WIDTH_PX = 794; // 210mm ที่ 96dpi

/**
 * ครอบกระดาษ A4 แล้วย่อให้พอดีความกว้างของช่องที่มี
 * (ตอนพิมพ์ CSS ใน globals.css จะล้าง transform ทิ้ง ให้ได้ขนาดจริง)
 */
export default function PaperPreview({ children }: { children: React.ReactNode }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const holder = holderRef.current;
    const paper = paperRef.current;
    if (!holder || !paper) return;

    const update = () => {
      const available = holder.clientWidth;
      const next = Math.min(1, available / A4_WIDTH_PX);
      setScale(next);
      setHeight(paper.offsetHeight * next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(holder);
    ro.observe(paper);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={holderRef} className="paper-viewport w-full">
      {/* ความสูงถูกล็อกไว้เท่ากระดาษที่ย่อแล้ว (transform ไม่กินที่ในเลย์เอาต์)
          ตอนพิมพ์ CSS จะปลดล็อกกลับเป็น auto */}
      <div className="paper-fit" style={{ height }}>
        <div
          ref={paperRef}
          className="paper-screen w-[794px] origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
