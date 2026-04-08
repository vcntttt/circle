import { redirect } from 'next/navigation';

export default async function TeamsPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/projects');
}
