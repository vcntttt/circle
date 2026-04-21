import { asc, desc, eq, sql } from 'drizzle-orm';
import { db, schema } from './index';

export interface ProjectListItem {
   id: string;
   name: string;
   slug: string;
   description: string | null;
   status: string;
   priority: string;
   createdAt: Date;
   updatedAt: Date;
}

export interface ProjectStatusOption {
   id: string;
   name: string;
   color: string;
   position: number;
}

export interface ProjectPriorityOption {
   id: string;
   name: string;
   color: string;
   position: number;
}

interface ProjectsPageData {
   projects: ProjectListItem[];
   statusOptions: ProjectStatusOption[];
   priorityOptions: ProjectPriorityOption[];
   databaseError: string | null;
   isConnected: boolean;
}

export interface CreateProjectInput {
   name: string;
   description?: string;
   status: string;
   priority?: string;
}

export interface UpdateProjectInput {
   status?: string;
   priority?: string;
}

export interface SaveProjectOptionInput {
   name: string;
   color: string;
}

export interface ReorderProjectOptionsInput {
   ids: string[];
}

function toOptionId(value: string): string {
   return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
         priority: schema.projects.priority,
         createdAt: schema.projects.createdAt,
         updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .orderBy(desc(schema.projects.updatedAt), desc(schema.projects.createdAt));
}

export async function getProjectStatusOptions(): Promise<ProjectStatusOption[]> {
   if (!db) {
      return [];
   }

   return db
      .select({
         id: schema.projectStatuses.id,
         name: schema.projectStatuses.name,
         color: schema.projectStatuses.color,
         position: schema.projectStatuses.position,
      })
      .from(schema.projectStatuses)
      .orderBy(asc(schema.projectStatuses.position), asc(schema.projectStatuses.name));
}

export async function getProjectPriorityOptions(): Promise<ProjectPriorityOption[]> {
   if (!db) {
      return [];
   }

   return db
      .select({
         id: schema.projectPriorities.id,
         name: schema.projectPriorities.name,
         color: schema.projectPriorities.color,
         position: schema.projectPriorities.position,
      })
      .from(schema.projectPriorities)
      .orderBy(asc(schema.projectPriorities.position), asc(schema.projectPriorities.name));
}

export async function getProjectsPageData(): Promise<ProjectsPageData> {
   if (!db) {
      return {
         projects: [],
         statusOptions: [],
         priorityOptions: [],
         databaseError:
            'DATABASE_URL is missing. Add it to your local environment before loading projects.',
         isConnected: false,
      };
   }

   try {
      const [projects, statusOptions, priorityOptions] = await Promise.all([
         getAllProjects(),
         getProjectStatusOptions(),
         getProjectPriorityOptions(),
      ]);

      return {
         projects,
         statusOptions,
         priorityOptions,
         databaseError: null,
         isConnected: true,
      };
   } catch (error) {
      console.error('Failed to load projects from Postgres.', error);

      return {
         projects: [],
         statusOptions: [],
         priorityOptions: [],
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

   const slug = toOptionId(input.name);

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
         priority: input.priority ?? 'no-priority',
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
         priority: schema.projects.priority,
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

export async function updateProjectRecord(
   projectId: string,
   input: UpdateProjectInput
): Promise<ProjectListItem | null> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db
      .update(schema.projects)
      .set({
         ...(input.status !== undefined ? { status: input.status } : {}),
         ...(input.priority !== undefined ? { priority: input.priority } : {}),
         updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

   const project = await db
      .select({
         id: schema.projects.id,
         name: schema.projects.name,
         slug: schema.projects.slug,
         description: schema.projects.description,
         status: schema.projects.status,
         priority: schema.projects.priority,
         createdAt: schema.projects.createdAt,
         updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

   return project[0] ?? null;
}

export async function createProjectStatusOption(
   input: SaveProjectOptionInput
): Promise<ProjectStatusOption> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const id = toOptionId(input.name);

   if (!id) {
      throw new Error('Status name must contain letters or numbers.');
   }

   const existingId = await db
      .select({ id: schema.projectStatuses.id })
      .from(schema.projectStatuses)
      .where(eq(schema.projectStatuses.id, id))
      .limit(1);

   if (existingId.length > 0) {
      throw new Error('A status with that name already exists.');
   }

   const maxPosition = await db
      .select({ value: sql<number>`coalesce(max(${schema.projectStatuses.position}), -1)` })
      .from(schema.projectStatuses);

   const position = (maxPosition[0]?.value ?? -1) + 1;

   const inserted = await db
      .insert(schema.projectStatuses)
      .values({ id, name: input.name, color: input.color, position })
      .returning({
         id: schema.projectStatuses.id,
         name: schema.projectStatuses.name,
         color: schema.projectStatuses.color,
         position: schema.projectStatuses.position,
      });

   if (!inserted[0]) {
      throw new Error('Status could not be created.');
   }

   return inserted[0];
}

export async function updateProjectStatusOption(
   id: string,
   input: SaveProjectOptionInput
): Promise<ProjectStatusOption> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db
      .update(schema.projectStatuses)
      .set({ name: input.name, color: input.color, updatedAt: new Date() })
      .where(eq(schema.projectStatuses.id, id));

   const updated = await db
      .select({
         id: schema.projectStatuses.id,
         name: schema.projectStatuses.name,
         color: schema.projectStatuses.color,
         position: schema.projectStatuses.position,
      })
      .from(schema.projectStatuses)
      .where(eq(schema.projectStatuses.id, id))
      .limit(1);

   if (!updated[0]) {
      throw new Error('Status no longer exists.');
   }

   return updated[0];
}

export async function deleteProjectStatusOption(id: string): Promise<void> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const usage = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.status, id))
      .limit(1);

   if (usage.length > 0) {
      throw new Error('This status is currently used by one or more projects.');
   }

   await db.delete(schema.projectStatuses).where(eq(schema.projectStatuses.id, id));
}

export async function createProjectPriorityOption(
   input: SaveProjectOptionInput
): Promise<ProjectPriorityOption> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const id = toOptionId(input.name);

   if (!id) {
      throw new Error('Priority name must contain letters or numbers.');
   }

   const existingId = await db
      .select({ id: schema.projectPriorities.id })
      .from(schema.projectPriorities)
      .where(eq(schema.projectPriorities.id, id))
      .limit(1);

   if (existingId.length > 0) {
      throw new Error('A priority with that name already exists.');
   }

   const maxPosition = await db
      .select({ value: sql<number>`coalesce(max(${schema.projectPriorities.position}), -1)` })
      .from(schema.projectPriorities);

   const position = (maxPosition[0]?.value ?? -1) + 1;

   const inserted = await db
      .insert(schema.projectPriorities)
      .values({ id, name: input.name, color: input.color, position })
      .returning({
         id: schema.projectPriorities.id,
         name: schema.projectPriorities.name,
         color: schema.projectPriorities.color,
         position: schema.projectPriorities.position,
      });

   if (!inserted[0]) {
      throw new Error('Priority could not be created.');
   }

   return inserted[0];
}

export async function updateProjectPriorityOption(
   id: string,
   input: SaveProjectOptionInput
): Promise<ProjectPriorityOption> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db
      .update(schema.projectPriorities)
      .set({ name: input.name, color: input.color, updatedAt: new Date() })
      .where(eq(schema.projectPriorities.id, id));

   const updated = await db
      .select({
         id: schema.projectPriorities.id,
         name: schema.projectPriorities.name,
         color: schema.projectPriorities.color,
         position: schema.projectPriorities.position,
      })
      .from(schema.projectPriorities)
      .where(eq(schema.projectPriorities.id, id))
      .limit(1);

   if (!updated[0]) {
      throw new Error('Priority no longer exists.');
   }

   return updated[0];
}

export async function reorderProjectStatusOptions(
   input: ReorderProjectOptionsInput
): Promise<void> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db.transaction(async (tx) => {
      for (let index = 0; index < input.ids.length; index += 1) {
         await tx
            .update(schema.projectStatuses)
            .set({ position: index, updatedAt: new Date() })
            .where(eq(schema.projectStatuses.id, input.ids[index]));
      }
   });
}

export async function deleteProjectPriorityOption(id: string): Promise<void> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const usage = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.priority, id))
      .limit(1);

   if (usage.length > 0) {
      throw new Error('This priority is currently used by one or more projects.');
   }

   await db.delete(schema.projectPriorities).where(eq(schema.projectPriorities.id, id));
}
