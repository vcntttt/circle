import { redirect } from 'next/navigation';

export default async function LegacyIssueDetailPage({
   params,
}: {
   params: Promise<{ orgId: string; issueIdentifier: string }>;
}) {
   const { issueIdentifier } = await params;

   redirect(`/issues/${issueIdentifier}`);
}
