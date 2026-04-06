import type { Metadata } from 'next';
import AllIssues from '@/components/common/issues/all-issues';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';

export const metadata: Metadata = {
   title: 'Issues',
   description: 'Issue tracking for the personal Circle workspace.',
};

export default function IssuesPage() {
   return (
      <MainLayout header={<Header />}>
         <AllIssues />
      </MainLayout>
   );
}
