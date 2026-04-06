import { redirect } from 'next/navigation';

export default async function TeamsPage({ params }: { params: Promise<{ orgId: string }> }) {
   const { orgId } = await params;

   redirect(`/${orgId}/projects`);
}
