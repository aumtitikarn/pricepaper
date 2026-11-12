import SettingsForm from '@/components/SettingsForm';
import { PageHeader, SetupNotice } from '@/components/ui';
import { isDbConfigured, getShopSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const settings = await getShopSettings();

  // กว้างกว่า Container ปกติ เพื่อให้ตัวอย่างเอกสารอยู่ข้างฟอร์มได้
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader title="ตั้งค่าร้าน" subtitle="ข้อมูลชุดนี้จะไปแสดงบนหัวและท้ายเอกสารทุกฉบับ" />
      <SettingsForm settings={settings} />
    </div>
  );
}
