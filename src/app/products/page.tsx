import ProductManager from '@/components/ProductManager';
import { Container, ErrorNotice, PageHeader, SetupNotice } from '@/components/ui';
import { isDbConfigured, listProducts } from '@/lib/data';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  if (!isDbConfigured) return <SetupNotice />;

  let products: Product[] = [];
  let error: string | null = null;
  try {
    // รวมรายการที่ปิดใช้งานด้วย เพื่อให้แก้กลับมาเปิดได้
    products = await listProducts(true);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <Container>
      <PageHeader
        title="สินค้า / บริการ"
        subtitle={`${products.length} รายการ — ใช้เติมราคาอัตโนมัติตอนออกเอกสาร`}
      />
      {error ? <ErrorNotice message={error} /> : <ProductManager products={products} />}
    </Container>
  );
}
