import { redirect } from 'next/navigation';

export default async function LegacySettingsPage({
   params,
}: {
   params: Promise<{ orgId: string }>;
}) {
   await params;

   redirect('/settings');
}
