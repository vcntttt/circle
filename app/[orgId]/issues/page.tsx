import { redirect } from 'next/navigation';

export default async function LegacyIssuesPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/issues');
}
