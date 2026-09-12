import CustomerManager from '@/components/CustomerManager';
import { Container, ErrorNotice, PageHeader, SetupNotice } from '@/components/ui';
import { isDbConfigured, listCustomers } from '@/lib/data';
import type { Customer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  if (!isDbConfigured) return <SetupNotice />;

  let customers: Customer[] = [];
  let error: string | null = null;
  try {
    customers = await listCustomers();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <Container>
      <PageHeader title="ลูกค้า" subtitle={`${customers.length} รายในทะเบียน`} />
      {error ? <ErrorNotice message={error} /> : <CustomerManager customers={customers} />}
    </Container>
  );
}
