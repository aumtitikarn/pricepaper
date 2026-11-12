import DocumentEditor from '@/components/DocumentEditor';
import { SetupNotice, Container, ErrorNotice } from '@/components/ui';
import { isDbConfigured, getShopSettings, listCustomers, listProducts } from '@/lib/data';
import type { DocType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const { type } = await searchParams;
  const docType: DocType = type === 'receipt' ? 'receipt' : 'quotation';

  try {
    const [customers, products, shop] = await Promise.all([
      listCustomers(),
      listProducts(),
      getShopSettings(),
    ]);

    return (
      <DocumentEditor
        mode="create"
        docType={docType}
        customers={customers}
        products={products}
        shop={shop}
      />
    );
  } catch (e) {
    return (
      <Container>
        <ErrorNotice message={e instanceof Error ? e.message : String(e)} />
      </Container>
    );
  }
}
