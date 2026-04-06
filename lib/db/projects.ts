import { desc } from 'drizzle-orm';
import { db, schema } from './index';

export interface ProjectListItem {
   id: string;
   name: string;
   slug: string;
   description: string | null;
   status: string;
   createdAt: Date;
   updatedAt: Date;
}

interface ProjectsPageData {
   projects: ProjectListItem[];
   databaseError: string | null;
   isConnected: boolean;
}

export async function getProjectsPageData(): Promise<ProjectsPageData> {
   if (!db) {
      return {
         projects: [],
         databaseError:
            'DATABASE_URL is missing. Add it to your local environment before loading projects.',
         isConnected: false,
      };
   }

   try {
      const projects = await db
         .select({
            id: schema.projects.id,
            name: schema.projects.name,
            slug: schema.projects.slug,
            description: schema.projects.description,
            status: schema.projects.status,
            createdAt: schema.projects.createdAt,
            updatedAt: schema.projects.updatedAt,
         })
         .from(schema.projects)
         .orderBy(desc(schema.projects.updatedAt), desc(schema.projects.createdAt));

      return {
         projects,
         databaseError: null,
         isConnected: true,
      };
   } catch (error) {
      console.error('Failed to load projects from Postgres.', error);

      return {
         projects: [],
         databaseError:
            'The projects list could not be loaded from PostgreSQL. Start the database and run the migrations before opening this page.',
         isConnected: false,
      };
   }
}
