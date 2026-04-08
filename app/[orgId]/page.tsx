import { redirect } from 'next/navigation';

export default async function OrgIdPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/projects');
}
