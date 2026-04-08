import type { Metadata } from 'next';
import AllIssues from '@/components/common/issues/all-issues';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';
import { getIssuesPageData } from '@/lib/db/issues';

export const metadata: Metadata = {
   title: 'Issues',
   description: 'Issue tracking for the personal Circle workspace.',
};

export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
   const { issues, databaseError } = await getIssuesPageData();

   return (
      <MainLayout header={<Header />}>
         <AllIssues initialIssues={issues} databaseError={databaseError} />
      </MainLayout>
   );
}
