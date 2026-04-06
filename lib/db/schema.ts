import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
   id: uuid('id').defaultRandom().primaryKey(),
   name: text('name').notNull(),
   slug: text('slug').notNull().unique(),
   description: text('description'),
   status: text('status').notNull().default('active'),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issues = pgTable('issues', {
   id: uuid('id').defaultRandom().primaryKey(),
   projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
   title: text('title').notNull(),
   description: text('description'),
   status: text('status').notNull().default('backlog'),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const labels = pgTable('labels', {
   id: uuid('id').defaultRandom().primaryKey(),
   name: text('name').notNull().unique(),
   color: text('color').notNull().default('#6b7280'),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issueLabels = pgTable(
   'issue_labels',
   {
      issueId: uuid('issue_id')
         .notNull()
         .references(() => issues.id, { onDelete: 'cascade' }),
      labelId: uuid('label_id')
         .notNull()
         .references(() => labels.id, { onDelete: 'cascade' }),
   },
   (table) => [
      primaryKey({
         columns: [table.issueId, table.labelId],
      }),
   ]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
