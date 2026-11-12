import { notFound } from 'next/navigation';
import Link from 'next/link';
import DocumentPaper from '@/components/DocumentPaper';
import PaperPreview from '@/components/PaperPreview';
import DocumentToolbar from '@/components/DocumentToolbar';
import { Container, ErrorNotice, SetupNotice } from '@/components/ui';
import {
  getDocument,
  getShopSettings,
  isDbConfigured,
  listLinkedDocuments,
} from '@/lib/data';
import type { DocumentWithItems, ShopSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const { id } = await params;

  let doc: DocumentWithItems | null;
  let shop: ShopSettings;
  let linked: { id: string; doc_number: string }[];

  try {
    [doc, shop, linked] = await Promise.all([
      getDocument(id),
      getShopSettings(),
      listLinkedDocuments(id),
    ]);
  } catch (e) {
    return (
      <Container>
        <ErrorNotice message={e instanceof Error ? e.message : String(e)} />
      </Container>
    );
  }

  // notFound() ต้องอยู่นอก try — มันทำงานด้วยการ throw ให้ Next จับ
  if (!doc) notFound();

  return (
    <div className="mx-auto w-full max-w-[850px] px-4 py-6 sm:px-6 lg:py-8">
      <DocumentToolbar
        id={doc.id}
        docNumber={doc.doc_number}
        docType={doc.doc_type}
        status={doc.status}
        hasReceipt={linked.length > 0}
      />

      {(linked.length > 0 || doc.source_document_id) && (
        <div className="no-print mb-5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {linked.length > 0 && (
            <p>
              ออกใบเสร็จจากเอกสารนี้แล้ว:{' '}
              {linked.map((l, i) => (
                <span key={l.id}>
                  {i > 0 && ', '}
                  <Link href={`/documents/${l.id}`} className="font-mono font-medium underline">
                    {l.doc_number}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {doc.source_document_id && (
            <p>
              อ้างอิงจากใบเสนอราคา:{' '}
              <Link
                href={`/documents/${doc.source_document_id}`}
                className="font-medium underline"
              >
                ดูใบเสนอราคาต้นทาง
              </Link>
            </p>
          )}
        </div>
      )}

      <PaperPreview>
        <DocumentPaper
          shop={shop}
          doc={{
            doc_type: doc.doc_type,
            doc_number: doc.doc_number,
            issue_date: doc.issue_date,
            valid_until: doc.valid_until,
            customer_name: doc.customer_name,
            customer_company: doc.customer_company,
            customer_phone: doc.customer_phone,
            customer_email: doc.customer_email,
            customer_address: doc.customer_address,
            customer_tax_id: doc.customer_tax_id,
            subtotal: doc.subtotal,
            discount: doc.discount,
            total: doc.total,
            payment_method: doc.payment_method,
            paid_at: doc.paid_at,
            notes: doc.notes,
            terms: doc.terms,
            items: doc.document_items,
          }}
        />
      </PaperPreview>
    </div>
  );
}
