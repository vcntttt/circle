import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
   title: 'Inbox',
   description: 'Legacy inbox route redirected to issues.',
};

export default function InboxPage() {
   redirect('/issues');
}
