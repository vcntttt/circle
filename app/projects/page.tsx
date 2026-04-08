import type { Metadata } from 'next';
import MainLayout from '@/components/layout/main-layout';
import Header from '@/components/layout/headers/projects/header';
import Projects from '@/components/common/projects/projects';
import { getProjectsPageData } from '@/lib/db/projects';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
   title: 'Projects',
   description: 'Projects backed by PostgreSQL for the personal Circle tracker.',
};

export default async function ProjectsPage() {
   const { projects, databaseError, isConnected } = await getProjectsPageData();

   return (
      <MainLayout header={<Header count={projects.length} isConnected={isConnected} />}>
         <Projects projects={projects} databaseError={databaseError} />
      </MainLayout>
   );
}
