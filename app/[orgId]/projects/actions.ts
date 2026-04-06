'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '@/lib/db';

export interface CreateProjectActionState {
   success: boolean;
   error: string | null;
}

const initialStatuses = [
   'backlog',
   'to-do',
   'in-progress',
   'technical-review',
   'paused',
   'completed',
] as const;

const createProjectSchema = z.object({
   orgId: z.string().min(1),
   name: z.string().trim().min(2).max(120),
   description: z.string().trim().max(500).optional(),
   status: z.enum(initialStatuses),
});

const toSlug = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

export async function createProjectAction(
   _previousState: CreateProjectActionState,
   formData: FormData
): Promise<CreateProjectActionState> {
   if (!db) {
      return {
         success: false,
         error: 'Database unavailable. Start PostgreSQL before creating projects.',
      };
   }

   const parsed = createProjectSchema.safeParse({
      orgId: formData.get('orgId'),
      name: formData.get('name'),
      description: formData.get('description') ?? '',
      status: formData.get('status'),
   });

   if (!parsed.success) {
      return {
         success: false,
         error: 'Name must be at least 2 characters and the selected status must be valid.',
      };
   }

   const { orgId, name, description, status } = parsed.data;
   const slug = toSlug(name);

   if (!slug) {
      return {
         success: false,
         error: 'Project name must contain letters or numbers so a slug can be generated.',
      };
   }

   const existingProject = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.slug, slug))
      .limit(1);

   if (existingProject.length > 0) {
      return {
         success: false,
         error: `A project with the slug "${slug}" already exists. Choose a different name.`,
      };
   }

   await db.insert(schema.projects).values({
      name,
      slug,
      description: description || null,
      status,
   });

   revalidatePath(`/${orgId}/projects`);

   return {
      success: true,
      error: null,
   };
}
