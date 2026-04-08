import { redirect } from 'next/navigation';

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/projects');
}
