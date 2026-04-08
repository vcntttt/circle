import { redirect } from 'next/navigation';

export default async function AllIssuesPage({
   params,
}: {
   params: Promise<{ orgId: string; teamId: string }>;
}) {
   await params;

   redirect('/issues');
}
