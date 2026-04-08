import { redirect } from 'next/navigation';

export default async function LegacyProjectsPage({
   params,
}: {
   params: Promise<{ orgId: string }>;
}) {
   await params;

   redirect('/projects');
}
