import {
   index,
   integer,
   numeric,
   pgTable,
   primaryKey,
   text,
   timestamp,
   uuid,
} from 'drizzle-orm/pg-core';

export const projectStatuses = pgTable('project_statuses', {
   id: text('id').primaryKey(),
   name: text('name').notNull().unique(),
   color: text('color').notNull().default('#94a3b8'),
   position: integer('position').notNull().default(0),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projectPriorities = pgTable('project_priorities', {
   id: text('id').primaryKey(),
   name: text('name').notNull().unique(),
   color: text('color').notNull().default('#94a3b8'),
   position: integer('position').notNull().default(0),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable('projects', {
   id: uuid('id').defaultRandom().primaryKey(),
   name: text('name').notNull(),
   slug: text('slug').notNull().unique(),
   description: text('description'),
   status: text('status')
      .notNull()
      .default('backlog')
      .references(() => projectStatuses.id),
   priority: text('priority')
      .notNull()
      .default('no-priority')
      .references(() => projectPriorities.id),
   createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projectUpdates = pgTable(
   'project_updates',
   {
      id: uuid('id').defaultRandom().primaryKey(),
      projectId: uuid('project_id')
         .notNull()
         .references(() => projects.id, { onDelete: 'cascade' }),
      health: text('health').notNull(),
      body: text('body').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
   },
   (table) => [index('project_updates_project_created_at_idx').on(table.projectId, table.createdAt)]
);

export const issues = pgTable(
   'issues',
   {
      id: uuid('id').defaultRandom().primaryKey(),
      identifier: text('identifier').notNull().unique(),
      projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
      parentIssueId: uuid('parent_issue_id').references((): any => issues.id, {
         onDelete: 'set null',
      }),
      title: text('title').notNull(),
      description: text('description'),
      status: text('status').notNull().default('backlog'),
      priority: text('priority').notNull().default('no-priority'),
      assigneeId: text('assignee_id'),
      rank: text('rank').notNull(),
      estimatedHours: numeric('estimated_hours', { precision: 6, scale: 2 }),
      dueDate: timestamp('due_date', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
   },
   (table) => [index('issues_parent_issue_id_idx').on(table.parentIssueId)]
);

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
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;
export type ProjectStatus = typeof projectStatuses.$inferSelect;
export type NewProjectStatus = typeof projectStatuses.$inferInsert;
export type ProjectPriority = typeof projectPriorities.$inferSelect;
export type NewProjectPriority = typeof projectPriorities.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
