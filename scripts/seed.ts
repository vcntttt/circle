import 'dotenv/config';
import { db, pool, schema } from '../lib/db';
import { labels as mockLabels } from '../mock-data/labels';
import { issues as mockIssues } from '../mock-data/issues';
import { projects as mockProjects } from '../mock-data/projects';

const toSlug = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

async function main() {
   if (!db || !pool) {
      throw new Error('DATABASE_URL is required before running the seed script.');
   }

   const seedProjects = mockProjects.map((project) => ({
      name: project.name,
      slug: toSlug(project.name),
      description: `Seeded from the original Circle mock dataset for ${project.name}.`,
      status: project.status.id,
   }));

   const insertedProjects = await db
      .insert(schema.projects)
      .values(seedProjects)
      .onConflictDoNothing({ target: schema.projects.slug })
      .returning({ id: schema.projects.id });

   const seedLabels = mockLabels.map((label) => ({
      name: label.name,
      color: label.color,
   }));

   const insertedLabels = await db
      .insert(schema.labels)
      .values(seedLabels)
      .onConflictDoNothing({ target: schema.labels.name })
      .returning({ id: schema.labels.id });

   const allProjects = await db
      .select({ id: schema.projects.id, slug: schema.projects.slug })
      .from(schema.projects);

   const allLabels = await db
      .select({ id: schema.labels.id, name: schema.labels.name })
      .from(schema.labels);

   const projectBySlug = new Map(allProjects.map((project) => [project.slug, project.id]));
   const labelByName = new Map(allLabels.map((label) => [label.name, label.id]));

   const seedIssues = mockIssues.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      status: issue.status.id,
      priority: issue.priority.id,
      assigneeId: issue.assignee?.id ?? null,
      rank: issue.rank,
      dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.createdAt),
      projectId: issue.project ? (projectBySlug.get(toSlug(issue.project.name)) ?? null) : null,
   }));

   const insertedIssues = await db
      .insert(schema.issues)
      .values(seedIssues)
      .onConflictDoNothing({ target: schema.issues.identifier })
      .returning({ id: schema.issues.id });

   const allIssues = await db
      .select({ id: schema.issues.id, identifier: schema.issues.identifier })
      .from(schema.issues);

   const issueByIdentifier = new Map(allIssues.map((issue) => [issue.identifier, issue.id]));

   const seedIssueLabels = mockIssues.flatMap((issue) => {
      const issueId = issueByIdentifier.get(issue.identifier);
      if (!issueId) {
         return [];
      }

      return issue.labels
         .map((label) => {
            const labelId = labelByName.get(label.name);
            if (!labelId) {
               return null;
            }

            return {
               issueId,
               labelId,
            };
         })
         .filter((value): value is { issueId: string; labelId: string } => value !== null);
   });

   if (seedIssueLabels.length > 0) {
      await db.insert(schema.issueLabels).values(seedIssueLabels).onConflictDoNothing();
   }

   console.log(`Inserted ${insertedProjects.length} projects.`);
   console.log(`Inserted ${insertedLabels.length} labels.`);
   console.log(`Inserted ${insertedIssues.length} issues.`);
}

main()
   .catch((error) => {
      console.error('Failed to seed database.', error);
      process.exitCode = 1;
   })
   .finally(async () => {
      await pool?.end();
   });
