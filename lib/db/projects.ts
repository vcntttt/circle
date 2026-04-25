import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from './index';

export type ProjectHealth = 'no-update' | 'off-track' | 'on-track' | 'at-risk';

export interface ProjectLatestUpdate {
   id: string;
   projectId: string;
   health: ProjectHealth;
   body: string;
   createdAt: Date;
   updatedAt: Date;
}

export interface ProjectTimelineUpdate extends ProjectLatestUpdate {
   project: {
      id: string;
      name: string;
      slug: string;
   };
}

export interface ProjectListItem {
   id: string;
   name: string;
   slug: string;
   key: string;
   description: string | null;
   iconType: string;
   iconValue: string;
   status: string;
   priority: string;
   latestUpdate: ProjectLatestUpdate | null;
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

interface ProjectUpdatesPageData {
   updates: ProjectTimelineUpdate[];
   databaseError: string | null;
   isConnected: boolean;
}

export interface CreateProjectInput {
   name: string;
   key?: string;
   description?: string;
   iconType?: string;
   iconValue?: string;
   status: string;
   priority?: string;
}

export interface UpdateProjectInput {
   status?: string;
   priority?: string;
}

export interface UpdateProjectDetailsInput {
   name?: string;
   description?: string | null;
   iconType?: string;
   iconValue?: string;
}

export interface CreateProjectUpdateInput {
   projectId: string;
   health: ProjectHealth;
   body: string;
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

const projectKeyPattern = /^[A-Z][A-Z0-9]{1,9}$/;

export function normalizeProjectKey(value: string): string {
   return value
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 10);
}

export function createProjectKeyFromName(name: string): string {
   const words = name
      .toUpperCase()
      .trim()
      .split(/[^A-Z0-9]+/)
      .filter(Boolean);
   const acronym = words.map((word) => word[0]).join('');
   const candidate = acronym.length >= 2 ? acronym : normalizeProjectKey(name);

   return candidate.slice(0, 10);
}

function assertValidProjectKey(key: string): void {
   if (!projectKeyPattern.test(key)) {
      throw new Error(
         'Project key must be 2-10 uppercase letters or numbers and start with a letter.'
      );
   }
}

export async function getAllProjects(): Promise<ProjectListItem[]> {
   if (!db) {
      return [];
   }

   const projects = await db
      .select({
         id: schema.projects.id,
         name: schema.projects.name,
         slug: schema.projects.slug,
         key: schema.projects.key,
         description: schema.projects.description,
         iconType: schema.projects.iconType,
         iconValue: schema.projects.iconValue,
         status: schema.projects.status,
         priority: schema.projects.priority,
         createdAt: schema.projects.createdAt,
         updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .orderBy(desc(schema.projects.updatedAt), desc(schema.projects.createdAt));

   if (projects.length === 0) {
      return [];
   }

   const latestUpdates = await getLatestProjectUpdates(projects.map((project) => project.id));

   return projects.map((project) => ({
      ...project,
      latestUpdate: latestUpdates.get(project.id) ?? null,
   }));
}

async function getLatestProjectUpdates(
   projectIds: string[]
): Promise<Map<string, ProjectLatestUpdate>> {
   if (!db || projectIds.length === 0) {
      return new Map();
   }

   const updates = await db
      .select({
         id: schema.projectUpdates.id,
         projectId: schema.projectUpdates.projectId,
         health: schema.projectUpdates.health,
         body: schema.projectUpdates.body,
         createdAt: schema.projectUpdates.createdAt,
         updatedAt: schema.projectUpdates.updatedAt,
      })
      .from(schema.projectUpdates)
      .where(inArray(schema.projectUpdates.projectId, projectIds))
      .orderBy(desc(schema.projectUpdates.createdAt), desc(schema.projectUpdates.updatedAt));

   const latestByProject = new Map<string, ProjectLatestUpdate>();

   for (const update of updates) {
      if (latestByProject.has(update.projectId)) {
         continue;
      }

      latestByProject.set(update.projectId, {
         ...update,
         health: toProjectHealth(update.health),
      });
   }

   return latestByProject;
}

function toProjectHealth(value: string): ProjectHealth {
   if (
      value === 'no-update' ||
      value === 'off-track' ||
      value === 'on-track' ||
      value === 'at-risk'
   ) {
      return value;
   }

   return 'no-update';
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

export async function getProjectUpdatesPageData(): Promise<ProjectUpdatesPageData> {
   if (!db) {
      return {
         updates: [],
         databaseError:
            'DATABASE_URL is missing. Add it to your local environment before loading project updates.',
         isConnected: false,
      };
   }

   try {
      const updates = await db
         .select({
            id: schema.projectUpdates.id,
            projectId: schema.projectUpdates.projectId,
            health: schema.projectUpdates.health,
            body: schema.projectUpdates.body,
            createdAt: schema.projectUpdates.createdAt,
            updatedAt: schema.projectUpdates.updatedAt,
            projectName: schema.projects.name,
            projectSlug: schema.projects.slug,
         })
         .from(schema.projectUpdates)
         .innerJoin(schema.projects, eq(schema.projectUpdates.projectId, schema.projects.id))
         .orderBy(desc(schema.projectUpdates.createdAt), desc(schema.projectUpdates.updatedAt));

      return {
         updates: updates.map((update) => ({
            id: update.id,
            projectId: update.projectId,
            health: toProjectHealth(update.health),
            body: update.body,
            createdAt: update.createdAt,
            updatedAt: update.updatedAt,
            project: {
               id: update.projectId,
               name: update.projectName,
               slug: update.projectSlug,
            },
         })),
         databaseError: null,
         isConnected: true,
      };
   } catch (error) {
      console.error('Failed to load project updates from Postgres.', error);

      return {
         updates: [],
         databaseError:
            'The project updates timeline could not be loaded from PostgreSQL. Start the database and run the migrations before opening this page.',
         isConnected: false,
      };
   }
}

export async function createProjectRecord(input: CreateProjectInput): Promise<ProjectListItem> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const slug = toOptionId(input.name);
   const key = normalizeProjectKey(input.key || createProjectKeyFromName(input.name));

   if (!slug) {
      throw new Error('Project name must contain letters or numbers so a slug can be generated.');
   }

   assertValidProjectKey(key);

   const existingProject = await db
      .select({ id: schema.projects.id, slug: schema.projects.slug, key: schema.projects.key })
      .from(schema.projects)
      .where(sql`${schema.projects.slug} = ${slug} or ${schema.projects.key} = ${key}`);

   if (existingProject.some((project) => project.slug === slug)) {
      throw new Error(`A project with the slug "${slug}" already exists. Choose a different name.`);
   }

   if (existingProject.some((project) => project.key === key)) {
      throw new Error(`A project with the key "${key}" already exists. Choose a different key.`);
   }

   const inserted = await db
      .insert(schema.projects)
      .values({
         name: input.name,
         slug,
         key,
         description: input.description || null,
         iconType: input.iconType ?? 'lucide',
         iconValue: input.iconValue ?? 'box',
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
         key: schema.projects.key,
         description: schema.projects.description,
         iconType: schema.projects.iconType,
         iconValue: schema.projects.iconValue,
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

   return {
      ...project[0],
      latestUpdate: null,
   };
}

export async function createProjectUpdateRecord(
   input: CreateProjectUpdateInput
): Promise<ProjectLatestUpdate> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const project = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.id, input.projectId))
      .limit(1);

   if (!project[0]) {
      throw new Error('Project does not exist.');
   }

   const inserted = await db
      .insert(schema.projectUpdates)
      .values({
         projectId: input.projectId,
         health: input.health,
         body: input.body,
      })
      .returning({
         id: schema.projectUpdates.id,
         projectId: schema.projectUpdates.projectId,
         health: schema.projectUpdates.health,
         body: schema.projectUpdates.body,
         createdAt: schema.projectUpdates.createdAt,
         updatedAt: schema.projectUpdates.updatedAt,
      });

   if (!inserted[0]) {
      throw new Error('Project update could not be created.');
   }

   await db
      .update(schema.projects)
      .set({ updatedAt: new Date() })
      .where(eq(schema.projects.id, input.projectId));

   return {
      ...inserted[0],
      health: toProjectHealth(inserted[0].health),
   };
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
         key: schema.projects.key,
         description: schema.projects.description,
         iconType: schema.projects.iconType,
         iconValue: schema.projects.iconValue,
         status: schema.projects.status,
         priority: schema.projects.priority,
         createdAt: schema.projects.createdAt,
         updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

   if (!project[0]) {
      return null;
   }

   const latestUpdate = await getLatestProjectUpdates([projectId]);

   return {
      ...project[0],
      latestUpdate: latestUpdate.get(projectId) ?? null,
   };
}

export async function updateProjectDetailsRecord(
   projectId: string,
   input: UpdateProjectDetailsInput
): Promise<ProjectListItem | null> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db
      .update(schema.projects)
      .set({
         ...(input.name !== undefined ? { name: input.name } : {}),
         ...(input.description !== undefined ? { description: input.description } : {}),
         ...(input.iconType !== undefined ? { iconType: input.iconType } : {}),
         ...(input.iconValue !== undefined ? { iconValue: input.iconValue } : {}),
         updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

   const project = await db
      .select({
         id: schema.projects.id,
         name: schema.projects.name,
         slug: schema.projects.slug,
         key: schema.projects.key,
         description: schema.projects.description,
         iconType: schema.projects.iconType,
         iconValue: schema.projects.iconValue,
         status: schema.projects.status,
         priority: schema.projects.priority,
         createdAt: schema.projects.createdAt,
         updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

   if (!project[0]) {
      return null;
   }

   const latestUpdate = await getLatestProjectUpdates([projectId]);

   return {
      ...project[0],
      latestUpdate: latestUpdate.get(projectId) ?? null,
   };
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
