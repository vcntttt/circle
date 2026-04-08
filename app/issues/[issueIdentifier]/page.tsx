import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MainLayout from '@/components/layout/main-layout';
import { IssueDetail } from '@/components/common/issues/issue-detail';
import { getIssueByIdentifier } from '@/lib/db/issues';

interface IssueDetailPageProps {
   params: Promise<{ issueIdentifier: string }>;
}

export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
   const { issueIdentifier } = await params;

   return {
      title: issueIdentifier,
   };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
   const { issueIdentifier } = await params;
   const issue = await getIssueByIdentifier(issueIdentifier);

   if (!issue) {
      notFound();
   }

   return (
      <MainLayout headersNumber={1}>
         <IssueDetail issue={issue} />
      </MainLayout>
   );
}
