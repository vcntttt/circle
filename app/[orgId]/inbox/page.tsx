import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
   title: 'Inbox',
   description: 'Legacy org inbox route redirected to issues.',
};

export default async function LegacyInboxPage({ params }: { params: Promise<{ orgId: string }> }) {
   await params;

   redirect('/issues');
}
