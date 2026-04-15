import { desc, eq } from 'drizzle-orm';
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

export interface CreateProjectInput {
   name: string;
   description?: string;
   status: string;
}

export async function getAllProjects(): Promise<ProjectListItem[]> {
   if (!db) {
      return [];
   }

   return db
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
      const projects = await getAllProjects();

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

export async function createProjectRecord(input: CreateProjectInput): Promise<ProjectListItem> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

   if (!slug) {
      throw new Error('Project name must contain letters or numbers so a slug can be generated.');
   }

   const existingProject = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.slug, slug))
      .limit(1);

   if (existingProject.length > 0) {
      throw new Error(`A project with the slug "${slug}" already exists. Choose a different name.`);
   }

   const inserted = await db
      .insert(schema.projects)
      .values({
         name: input.name,
         slug,
         description: input.description || null,
         status: input.status,
      })
      .returning({ id: schema.projects.id });

   const projectId = inserted[0]?.id;

   if (!projectId) {
      throw new Error('Project could not be created.');
   }

   const project = await db
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
      .where(eq(schema.projects.id, projectId))
      .limit(1);

   if (!project[0]) {
      throw new Error('Created project could not be reloaded.');
   }

   return project[0];
}
