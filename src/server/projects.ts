import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createProjectRecord, getAllProjects, getProjectsPageData } from '@/lib/db/projects';

const createProjectSchema = z.object({
   name: z.string().trim().min(2).max(120),
   description: z.string().trim().max(500).optional(),
   status: z.enum(['backlog', 'to-do', 'in-progress', 'technical-review', 'paused', 'completed']),
});

export const getProjectOptions = createServerFn({ method: 'GET' }).handler(async () => {
   const projects = await getAllProjects();

   return projects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
   }));
});

export const getProjectsPage = createServerFn({ method: 'GET' }).handler(async () => {
   const result = await getProjectsPageData();

   return {
      ...result,
      projects: result.projects.map((project) => ({
         ...project,
         createdAt: project.createdAt.toISOString(),
         updatedAt: project.updatedAt.toISOString(),
      })),
   };
});

export const createProject = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => createProjectSchema.parse(data))
   .handler(async ({ data }) => {
      const project = await createProjectRecord(data);

      return {
         ...project,
         createdAt: project.createdAt.toISOString(),
         updatedAt: project.updatedAt.toISOString(),
      };
   });
