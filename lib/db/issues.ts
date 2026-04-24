import { asc, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from './index';
import { getProjectStatusOptions } from './projects';

export interface IssueSummary {
   id: string;
   identifier: string;
   title: string;
}

export interface IssueSubissueSummary extends IssueSummary {
   status: string;
   priority: string;
   assigneeId: string | null;
   rank: string;
}

export interface IssueListItem {
   id: string;
   identifier: string;
   title: string;
   description: string | null;
   status: string;
   priority: string;
   assigneeId: string | null;
   rank: string;
   estimatedHours: string | null;
   dueDate: string | null;
   createdAt: string;
   updatedAt: string;
   parentIssueId: string | null;
   parentIssue: IssueSummary | null;
   subissues: IssueSubissueSummary[];
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
   statusOptions: Awaited<ReturnType<typeof getProjectStatusOptions>>;
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
   estimatedHours: string | null;
   dueDate: Date | null;
   createdAt: Date;
   updatedAt: Date;
   parentIssueId: string | null;
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
   estimatedHours?: number | null;
   dueDate?: string | null;
   parentIssueId?: string | null;
   projectName?: string | null;
   labelNames?: string[];
}

export interface UpdateIssueInput {
   title?: string;
   description?: string | null;
   status?: string;
   priority?: string;
   assigneeId?: string | null;
   estimatedHours?: number | null;
   dueDate?: string | null;
   parentIssueId?: string | null;
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
         estimatedHours: schema.issues.estimatedHours,
         dueDate: schema.issues.dueDate,
         createdAt: schema.issues.createdAt,
         updatedAt: schema.issues.updatedAt,
         parentIssueId: schema.issues.parentIssueId,
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
            estimatedHours: row.estimatedHours,
            dueDate: row.dueDate ? row.dueDate.toISOString() : null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            parentIssueId: row.parentIssueId,
            parentIssue: null,
            subissues: [],
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

   const issues = Array.from(issuesMap.values());
   const issueLookup = new Map(issues.map((issue) => [issue.id, issue]));

   for (const issue of issues) {
      if (issue.parentIssueId) {
         const parentIssue = issueLookup.get(issue.parentIssueId);

         if (parentIssue) {
            issue.parentIssue = {
               id: parentIssue.id,
               identifier: parentIssue.identifier,
               title: parentIssue.title,
            };

            parentIssue.subissues.push({
               id: issue.id,
               identifier: issue.identifier,
               title: issue.title,
               status: issue.status,
               priority: issue.priority,
               assigneeId: issue.assigneeId,
               rank: issue.rank,
            });
         }
      }
   }

   for (const issue of issues) {
      issue.subissues.sort((left, right) => right.rank.localeCompare(left.rank));
   }

   return issues;
}

async function getMappedIssues(): Promise<IssueListItem[]> {
   return mapIssueRows(await selectIssueRows());
}

async function getIssueProjectIdByName(
   projectName: string | null | undefined
): Promise<string | null> {
   if (!db || !projectName) {
      return null;
   }

   const project = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.name, projectName))
      .limit(1);

   return project[0]?.id ?? null;
}

export async function validateParentAssignment(
   issueId: string,
   parentIssueId: string | null
): Promise<void> {
   if (!db || parentIssueId === null) {
      return;
   }

   if (issueId === parentIssueId) {
      throw new Error('An issue cannot be its own parent.');
   }

   const [issue, parentIssue, parentChildren] = await Promise.all([
      db
         .select({ id: schema.issues.id, parentIssueId: schema.issues.parentIssueId })
         .from(schema.issues)
         .where(eq(schema.issues.id, issueId))
         .limit(1),
      db
         .select({ id: schema.issues.id, parentIssueId: schema.issues.parentIssueId })
         .from(schema.issues)
         .where(eq(schema.issues.id, parentIssueId))
         .limit(1),
      db
         .select({ id: schema.issues.id })
         .from(schema.issues)
         .where(eq(schema.issues.parentIssueId, issueId)),
   ]);

   const currentIssue = issue[0];
   const selectedParent = parentIssue[0];

   if (!currentIssue) {
      throw new Error('Issue not found.');
   }

   if (!selectedParent) {
      throw new Error('Parent issue not found.');
   }

   if (parentChildren.length > 0) {
      throw new Error('Issues with subissues cannot become subissues.');
   }

   if (selectedParent.parentIssueId) {
      throw new Error('Subissues cannot have subissues.');
   }

   if (parentChildren.some((child) => child.id === parentIssueId)) {
      throw new Error('An issue cannot be assigned under one of its subissues.');
   }
}

export async function attachIssueToParent(issueId: string, parentIssueId: string): Promise<void> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await validateParentAssignment(issueId, parentIssueId);

   await db
      .update(schema.issues)
      .set({ parentIssueId, updatedAt: new Date() })
      .where(eq(schema.issues.id, issueId));
}

export async function detachIssueFromParent(issueId: string): Promise<void> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   await db
      .update(schema.issues)
      .set({ parentIssueId: null, updatedAt: new Date() })
      .where(eq(schema.issues.id, issueId));
}

export async function getIssueById(issueId: string): Promise<IssueListItem | null> {
   const issues = await getMappedIssues();
   return issues.find((issue) => issue.id === issueId) ?? null;
}

export async function getIssueByIdentifier(identifier: string): Promise<IssueListItem | null> {
   const issues = await getMappedIssues();
   return issues.find((issue) => issue.identifier === identifier) ?? null;
}

export async function createIssueRecord(input: CreateIssueInput): Promise<IssueListItem> {
   if (!db) {
      throw new Error('Database unavailable.');
   }

   const projectId = await getIssueProjectIdByName(input.projectName);

   const inserted = await db
      .insert(schema.issues)
      .values({
         identifier: uuidv4(),
         title: input.title,
         description: input.description || null,
         status: input.status,
         priority: input.priority,
         assigneeId: input.assigneeId ?? null,
         rank: input.rank,
         estimatedHours:
            input.estimatedHours === undefined ? null : input.estimatedHours.toString(),
         dueDate: input.dueDate ? new Date(input.dueDate) : null,
         projectId,
      })
      .returning({ id: schema.issues.id });

   const issueId = inserted[0]?.id;

   if (!issueId) {
      throw new Error('Issue could not be created.');
   }

   if (input.parentIssueId) {
      await attachIssueToParent(issueId, input.parentIssueId);
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

   const projectId =
      input.projectName !== undefined
         ? await getIssueProjectIdByName(input.projectName)
         : undefined;

   if (input.parentIssueId !== undefined) {
      if (input.parentIssueId === null) {
         await detachIssueFromParent(issueId);
      } else {
         await attachIssueToParent(issueId, input.parentIssueId);
      }
   }

   await db
      .update(schema.issues)
      .set({
         ...(input.title !== undefined ? { title: input.title } : {}),
         ...(input.description !== undefined ? { description: input.description } : {}),
         ...(input.status ? { status: input.status } : {}),
         ...(input.priority ? { priority: input.priority } : {}),
         ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
         ...(input.estimatedHours !== undefined
            ? { estimatedHours: input.estimatedHours?.toString() ?? null }
            : {}),
         ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
         ...(input.projectName !== undefined ? { projectId: projectId ?? null } : {}),
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
         statusOptions: [],
         databaseError:
            'DATABASE_URL is missing. Add it to your local environment before loading issues.',
         isConnected: false,
      };
   }

   try {
      const [issues, statusOptions] = await Promise.all([
         getMappedIssues(),
         getProjectStatusOptions(),
      ]);

      return {
         issues,
         statusOptions,
         databaseError: null,
         isConnected: true,
      };
   } catch (error) {
      console.error('Failed to load issues from Postgres.', error);

      return {
         issues: [],
         statusOptions: [],
         databaseError:
            'The issues list could not be loaded from PostgreSQL. Start the database and run the migrations before opening this page.',
         isConnected: false,
      };
   }
}
