import { createFileRoute } from '@tanstack/react-router';
import Settings from '@/components/common/settings/settings';
import Header from '@/components/layout/headers/settings/header';
import MainLayout from '@/components/layout/main-layout';

export const Route = createFileRoute('/settings')({
   head: () => ({
      meta: [{ title: 'Settings | Circle Personal Fork' }],
   }),
   component: SettingsPage,
});

function SettingsPage() {
   return (
      <MainLayout header={<Header />} headersNumber={1}>
         <Settings />
      </MainLayout>
   );
}
