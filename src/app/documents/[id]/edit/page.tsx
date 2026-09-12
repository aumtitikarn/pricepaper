import { notFound } from 'next/navigation';
import DocumentEditor from '@/components/DocumentEditor';
import { SetupNotice, Container, ErrorNotice } from '@/components/ui';
import { isDbConfigured, getDocument, getShopSettings, listCustomers, listProducts } from '@/lib/data';
import type { Customer, DocumentWithItems, Product, ShopSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const { id } = await params;

  let loaded: [DocumentWithItems | null, Customer[], Product[], ShopSettings];
  try {
    loaded = await Promise.all([
      getDocument(id),
      listCustomers(),
      listProducts(),
      getShopSettings(),
    ]);
  } catch (e) {
    return (
      <Container>
        <ErrorNotice message={e instanceof Error ? e.message : String(e)} />
      </Container>
    );
  }

  // notFound() ต้องอยู่นอก try — มันทำงานด้วยการ throw ให้ Next จับ
  const [doc, customers, products, shop] = loaded;
  if (!doc) notFound();

  return (
    <DocumentEditor
      mode="edit"
      docType={doc.doc_type}
      initial={doc}
      customers={customers}
      products={products}
      shop={shop}
    />
  );
}
