'use client';

import React, { useEffect, useState } from "react";

// ✅ ประกาศ type ให้ชัดเจน
type RowItem = {
  description: string;
  price: number;
};

export default function QuotationPage() {
  const [rows, setRows] = useState<RowItem[]>([{ description: "", price: 0 }]);
  const [date, setDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setDate(today.toLocaleDateString("th-TH"));
  }, []);

  const handleChange = (
    index: number,
    key: keyof RowItem,
    value: string
  ) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      [key]: key === "price" ? parseFloat(value || "0") : value,
    };
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { description: "", price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const total = rows.reduce((sum, r) => sum + r.price, 0);

  const printQuotation = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      {/* ปุ่มควบคุม */}
      <div className="flex justify-end mb-4 gap-3 print:hidden">
        <button
          onClick={addRow}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow transition-colors"
        >
          ➕ เพิ่มรายการ
        </button>
        <button
          onClick={printQuotation}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow transition-colors"
        >
          🖨️ พิมพ์ใบเสนอราคา
        </button>
      </div>

      {/* ✅ ส่วนที่จะ export */}
      <div
        id="pdf-content"
        className="bg-white p-8 max-w-4xl mx-auto border border-gray-300 text-black shadow-lg print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ใบเสนอราคา</h1>
            <p className="text-lg text-gray-600 font-medium">ร้านนักเรียนไอที</p>
            <p className="text-sm text-gray-500 mt-1">โทร: 064-098-4337 | อีเมล: itstudentservice123@gmail.com | Line: @863icoey </p>
            <p className="text-sm text-gray-500">วันที่: {date}</p>
          </div>
          {/* Company Logo */}
          <img
            src="/logo.png"
            alt="โลโก้บริษัท"
            className="w-20 h-20 object-contain rounded-lg"
          />
        </div>

        {/* Customer Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">ข้อมูลลูกค้า:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">ชื่อ-นามสกุล:</label>
              <input 
                type="text" 
                className="w-full border-b border-gray-300 bg-transparent outline-none print:border-none"
                placeholder="กรอกชื่อลูกค้า"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">เบอร์โทร:</label>
              <input 
                type="text" 
                className="w-full border-b border-gray-300 bg-transparent outline-none print:border-none"
                placeholder="กรอกเบอร์โทร"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm border-collapse border border-gray-400">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-400 px-4 py-3 text-center font-semibold">ลำดับ</th>
              <th className="border border-gray-400 px-4 py-3 text-left font-semibold">รายการ</th>
              <th className="border border-gray-400 px-4 py-3 text-right font-semibold">ราคา (บาท)</th>
              <th className="border border-gray-400 px-2 py-3 text-center font-semibold print:hidden">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-400 px-4 py-3 text-center font-medium">{i + 1}</td>
                <td className="border border-gray-400 px-4 py-3">
                  <input
                    type="text"
                    className="w-full outline-none bg-transparent py-1"
                    value={row.description}
                    onChange={(e) =>
                      handleChange(i, "description", e.target.value)
                    }
                    placeholder="กรอกรายละเอียดสินค้า/บริการ"
                  />
                </td>
                <td className="border border-gray-400 px-4 py-3 text-right">
                  <input
                    type="number"
                    className="w-full outline-none text-right bg-transparent py-1"
                    value={row.price}
                    onChange={(e) =>
                      handleChange(i, "price", e.target.value)
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </td>
                <td className="border border-gray-400 px-2 py-3 text-center print:hidden">
                  <button
                    onClick={() => removeRow(i)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                    disabled={rows.length === 1}
                    title="ลบรายการ"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50">
              <td colSpan={2} className="text-right px-4 py-4 border border-gray-400 font-bold text-lg">
                รวมทั้งหมด
              </td>
              <td className="border border-gray-400 px-4 py-4 text-right font-bold text-lg text-blue-600">
                {total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </td>
              <td className="border border-gray-400 print:hidden"></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">เงื่อนไขการชำระเงิน:</h4>
              <p className="text-sm text-gray-600">• ชำระเงินล่วงหน้า 50%</p>
              <p className="text-sm text-gray-600">• ส่วนที่เหลือชำระเมื่อได้รับสินค้า</p>
              <p className="text-sm text-gray-600">• อาจจะมีค่าใช้จ่ายเพิ่มเติม เมื่อมีการเปลี่ยนแปลงรายการ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}