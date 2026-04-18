import { asc, eq, inArray } from 'drizzle-orm';
import { db, schema } from './index';

export interface IssueListItem {
   id: string;
   identifier: string;
   title: string;
   description: string | null;
   status: string;
   priority: string;
   assigneeId: string | null;
   rank: string;
   dueDate: string | null;
   createdAt: string;
   updatedAt: string;
   project: {
      id: string;
      name: string;
      slug: string;
      status: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
   } | null;
   labels: Array<{
      id: string;
      name: string;
      color: string;
   }>;
}

interface IssuesPageData {
   issues: IssueListItem[];
   databaseError: string | null;
   isConnected: boolean;
}

interface IssueRow {
   id: string;
   identifier: string;
   title: string;
   description: string | null;
   status: string;
   priority: string;
   assigneeId: string | null;
   rank: string;
   dueDate: Date | null;
   createdAt: Date;
   updatedAt: Date;
   projectId: string | null;
   projectName: string | null;
   projectSlug: string | null;
   projectStatus: string | null;
   projectDescription: string | null;
   projectCreatedAt: Date | null;
   projectUpdatedAt: Date | null;
   labelId: string | null;
   labelName: string | null;
   labelColor: string | null;
}

export interface CreateIssueInput {
   identifier: string;
   title: string;
   description?: string;
   status: string;
   priority: string;
   assigneeId?: string | null;
   rank: string;
   dueDate?: string | null;
   projectName?: string | null;
   labelNames?: string[];
}

export interface UpdateIssueInput {
   title?: string;
   description?: string | null;
   status?: string;
   priority?: string;
   assigneeId?: string | null;
   dueDate?: string | null;
   projectName?: string | null;
   labelNames?: string[];
}

async function selectIssueRows(issueId?: string): Promise<IssueRow[]> {
   if (!db) {
      return [];
   }

   const baseQuery = db
      .select({
         id: schema.issues.id,
         identifier: schema.issues.identifier,
         title: schema.issues.title,
         description: schema.issues.description,
         status: schema.issues.status,
         priority: schema.issues.priority,
         assigneeId: schema.issues.assigneeId,
         rank: schema.issues.rank,
         dueDate: schema.issues.dueDate,
         createdAt: schema.issues.createdAt,
         updatedAt: schema.issues.updatedAt,
         projectId: schema.projects.id,
         projectName: schema.projects.name,
         projectSlug: schema.projects.slug,
         projectStatus: schema.projects.status,
         projectDescription: schema.projects.description,
         projectCreatedAt: schema.projects.createdAt,
         projectUpdatedAt: schema.projects.updatedAt,
         labelId: schema.labels.id,
         labelName: schema.labels.name,
         labelColor: schema.labels.color,
      })
      .from(schema.issues)
      .leftJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
      .leftJoin(schema.issueLabels, eq(schema.issueLabels.issueId, schema.issues.id))
      .leftJoin(schema.labels, eq(schema.issueLabels.labelId, schema.labels.id));

   if (issueId) {
      return baseQuery.where(eq(schema.issues.id, issueId)).orderBy(asc(schema.issues.rank));
   }

   return baseQuery.orderBy(asc(schema.issues.rank), asc(schema.issues.createdAt));
}

async function selectIssueRowsByIdentifier(identifier: string): Promise<IssueRow[]> {
   if (!db) {
      return [];
   }

   return db
      .select({
         id: schema.issues.id,
         identifier: schema.issues.identifier,
         title: schema.issues.title,
         description: schema.issues.description,
         status: schema.issues.status,
         priority: schema.issues.priority,
         assigneeId: schema.issues.assigneeId,
         rank: schema.issues.rank,
         dueDate: schema.issues.dueDate,
         createdAt: schema.issues.createdAt,
         updatedAt: schema.issues.updatedAt,
         projectId: schema.projects.id,
         projectName: schema.projects.name,
         projectSlug: schema.projects.slug,
         projectStatus: schema.projects.status,
         projectDescription: schema.projects.description,
         projectCreatedAt: schema.projects.createdAt,
         projectUpdatedAt: schema.projects.updatedAt,
         labelId: schema.labels.id,
         labelName: schema.labels.name,
         labelColor: schema.labels.color,
      })
      .from(schema.issues)
      .leftJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
      .leftJoin(schema.issueLabels, eq(schema.issueLabels.issueId, schema.issues.id))
      .leftJoin(schema.labels, eq(schema.issueLabels.labelId, schema.labels.id))
      .where(eq(schema.issues.identifier, identifier))
      .orderBy(asc(schema.issues.rank));
}

function mapIssueRows(rows: IssueRow[]): IssueListItem[] {
   const issuesMap = new Map<string, IssueListItem>();

   for (const row of rows) {
      if (!issuesMap.has(row.id)) {
         issuesMap.set(row.id, {
            id: row.id,
            identifier: row.identifier,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assigneeId: row.assigneeId,
            rank: row.rank,
            dueDate: row.dueDate ? row.dueDate.toISOString() : null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            project: row.projectId
               ? {
                    id: row.projectId,
                    name: row.projectName!,
                    slug: row.projectSlug!,
                    status: row.projectStatus!,
                    description: row.projectDescription,
                    createdAt: row.projectCreatedAt!.toISOString(),
                    updatedAt: row.projectUpdatedAt!.toISOString(),
                 }
               : null,
            labels: [],
         });
      }

      if (row.labelId) {
         const currentIssue = issuesMap.get(row.id)!;
         currentIssue.labels.push({
            id: row.labelId,
            name: row.labelName!,
            color: row.labelColor!,
         });
      }
   }

   return Array.from(issuesMap.values());
}

export async function getIssueById(issueId: string): Promise<IssueListItem | null> {
   const rows = await selectIssueRows(issueId);
   return mapIssueRows(rows)[0] ?? null;
}

export async function getIssueByIdentifier(identifier: string): Promise<IssueListItem | null> {
   const rows = await selectIssueRowsByIdentifier(identifier);
   return mapIssueRows(rows)[0] ?? null;
}

export async function createIssueRecord(input: CreateIssueInput): Promise<IssueListItem> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const project = input.projectName
      ? await db
           .select({ id: schema.projects.id })
           .from(schema.projects)
           .where(eq(schema.projects.name, input.projectName))
           .limit(1)
      : [];

   const inserted = await db
      .insert(schema.issues)
      .values({
         identifier: input.identifier,
         title: input.title,
         description: input.description || null,
         status: input.status,
         priority: input.priority,
         assigneeId: input.assigneeId ?? null,
         rank: input.rank,
         dueDate: input.dueDate ? new Date(input.dueDate) : null,
         projectId: project[0]?.id ?? null,
      })
      .returning({ id: schema.issues.id });

   const issueId = inserted[0]?.id;

   if (!issueId) {
      throw new Error('Issue could not be created.');
   }

   if (input.labelNames && input.labelNames.length > 0) {
      const matchedLabels = await db
         .select({ id: schema.labels.id, name: schema.labels.name })
         .from(schema.labels)
         .where(inArray(schema.labels.name, input.labelNames));

      const issueLabels = matchedLabels.map((label) => ({
         issueId,
         labelId: label.id,
      }));

      if (issueLabels.length > 0) {
         await db.insert(schema.issueLabels).values(issueLabels).onConflictDoNothing();
      }
   }

   const createdIssue = await getIssueById(issueId);

   if (!createdIssue) {
      throw new Error('Created issue could not be reloaded.');
   }

   return createdIssue;
}

export async function updateIssueRecord(
   issueId: string,
   input: UpdateIssueInput
): Promise<IssueListItem | null> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const project = input.projectName
      ? await db
           .select({ id: schema.projects.id })
           .from(schema.projects)
           .where(eq(schema.projects.name, input.projectName))
           .limit(1)
      : null;

   await db
      .update(schema.issues)
      .set({
         ...(input.title !== undefined ? { title: input.title } : {}),
         ...(input.description !== undefined ? { description: input.description } : {}),
         ...(input.status ? { status: input.status } : {}),
         ...(input.priority ? { priority: input.priority } : {}),
         ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
         ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
         ...(input.projectName !== undefined ? { projectId: project?.[0]?.id ?? null } : {}),
         updatedAt: new Date(),
      })
      .where(eq(schema.issues.id, issueId));

   if (input.labelNames !== undefined) {
      await db.delete(schema.issueLabels).where(eq(schema.issueLabels.issueId, issueId));

      if (input.labelNames.length > 0) {
         const matchedLabels = await db
            .select({ id: schema.labels.id, name: schema.labels.name })
            .from(schema.labels)
            .where(inArray(schema.labels.name, input.labelNames));

         if (matchedLabels.length > 0) {
            await db
               .insert(schema.issueLabels)
               .values(
                  matchedLabels.map((label) => ({
                     issueId,
                     labelId: label.id,
                  }))
               )
               .onConflictDoNothing();
         }
      }
   }

   return getIssueById(issueId);
}

export async function deleteIssueRecord(issueId: string): Promise<boolean> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db.delete(schema.issueLabels).where(eq(schema.issueLabels.issueId, issueId));

   const deleted = await db
      .delete(schema.issues)
      .where(eq(schema.issues.id, issueId))
      .returning({ id: schema.issues.id });

   return deleted.length > 0;
}

export async function getIssuesPageData(): Promise<IssuesPageData> {
   if (!db) {
      return {
         issues: [],
         databaseError:
            'DATABASE_URL is missing. Add it to your local environment before loading issues.',
         isConnected: false,
      };
   }

   try {
      const joinedRows = await selectIssueRows();

      return {
         issues: mapIssueRows(joinedRows),
         databaseError: null,
         isConnected: true,
      };
   } catch (error) {
      console.error('Failed to load issues from Postgres.', error);

      return {
         issues: [],
         databaseError:
            'The issues list could not be loaded from PostgreSQL. Check the connection and run the migrations before opening this page.',
         isConnected: false,
      };
   }
}
