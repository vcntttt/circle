import { redirect } from 'next/navigation';

export default async function LegacyInboxPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/inbox');
}
