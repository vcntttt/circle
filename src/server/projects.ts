import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
   createProjectPriorityOption,
   createProjectRecord,
   createProjectStatusOption,
   createProjectUpdateRecord,
   deleteProjectPriorityOption,
   deleteProjectStatusOption,
   getAllProjects,
   getProjectPriorityOptions,
   getProjectStatusOptions,
   getProjectUpdatesPageData,
   getProjectsPageData,
   reorderProjectStatusOptions,
   updateProjectPriorityOption,
   updateProjectRecord,
   updateProjectStatusOption,
} from '@/lib/db/projects';
import type { ProjectLatestUpdate, ProjectTimelineUpdate } from '@/lib/db/projects';

const createProjectSchema = z.object({
   name: z.string().trim().min(2).max(120),
   description: z.string().trim().max(500).optional(),
   status: z.string().trim().min(1),
   priority: z.string().trim().min(1).optional(),
});

const updateProjectSchema = z
   .object({
      projectId: z.string().trim().min(1),
      status: z.string().trim().min(1).optional(),
      priority: z.string().trim().min(1).optional(),
   })
   .refine((value) => value.status !== undefined || value.priority !== undefined, {
      message: 'At least one project field must be provided.',
   });

const projectHealthSchema = z.enum(['no-update', 'off-track', 'on-track', 'at-risk']);

const createProjectUpdateSchema = z.object({
   projectId: z.string().trim().min(1),
   health: projectHealthSchema,
   body: z.string().trim().min(1).max(2000),
});

const projectOptionSchema = z.object({
   name: z.string().trim().min(1).max(80),
   color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{6})$/, 'Use a hex color like #f97316'),
});

const updateProjectOptionSchema = z.object({
   id: z.string().trim().min(1),
   name: z.string().trim().min(1).max(80),
   color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{6})$/, 'Use a hex color like #f97316'),
});

const deleteProjectOptionSchema = z.object({
   id: z.string().trim().min(1),
});

const reorderProjectOptionsSchema = z.object({
   ids: z.array(z.string().trim().min(1)).min(1),
});

function serializeProjectUpdate(update: ProjectLatestUpdate) {
   return {
      ...update,
      createdAt: update.createdAt.toISOString(),
      updatedAt: update.updatedAt.toISOString(),
   };
}

function serializeTimelineUpdate(update: ProjectTimelineUpdate) {
   return {
      ...update,
      createdAt: update.createdAt.toISOString(),
      updatedAt: update.updatedAt.toISOString(),
   };
}

export const getProjectOptions = createServerFn({ method: 'GET' }).handler(async () => {
   const projects = await getAllProjects();

   return projects.map((project) => ({
      ...project,
      latestUpdate: project.latestUpdate ? serializeProjectUpdate(project.latestUpdate) : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
   }));
});

export const getProjectStatusList = createServerFn({ method: 'GET' }).handler(async () => {
   return getProjectStatusOptions();
});

export const getProjectPriorityList = createServerFn({ method: 'GET' }).handler(async () => {
   return getProjectPriorityOptions();
});

export const getProjectsPage = createServerFn({ method: 'GET' }).handler(async () => {
   const result = await getProjectsPageData();

   return {
      ...result,
      projects: result.projects.map((project) => ({
         ...project,
         latestUpdate: project.latestUpdate ? serializeProjectUpdate(project.latestUpdate) : null,
         createdAt: project.createdAt.toISOString(),
         updatedAt: project.updatedAt.toISOString(),
      })),
   };
});

export const getProjectUpdatesPage = createServerFn({ method: 'GET' }).handler(async () => {
   const result = await getProjectUpdatesPageData();

   return {
      ...result,
      updates: result.updates.map(serializeTimelineUpdate),
   };
});

export const createProject = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => createProjectSchema.parse(data))
   .handler(async ({ data }) => {
      const project = await createProjectRecord(data);

      return {
         ...project,
         latestUpdate: project.latestUpdate ? serializeProjectUpdate(project.latestUpdate) : null,
         createdAt: project.createdAt.toISOString(),
         updatedAt: project.updatedAt.toISOString(),
      };
   });

export const updateProject = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => updateProjectSchema.parse(data))
   .handler(async ({ data }) => {
      const { projectId, ...payload } = data;
      const project = await updateProjectRecord(projectId, payload);

      if (!project) {
         return null;
      }

      return {
         ...project,
         latestUpdate: project.latestUpdate ? serializeProjectUpdate(project.latestUpdate) : null,
         createdAt: project.createdAt.toISOString(),
         updatedAt: project.updatedAt.toISOString(),
      };
   });

export const createProjectUpdate = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => createProjectUpdateSchema.parse(data))
   .handler(async ({ data }) => {
      const update = await createProjectUpdateRecord(data);

      return serializeProjectUpdate(update);
   });

export const createProjectStatus = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => projectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      return createProjectStatusOption(data);
   });

export const updateProjectStatus = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => updateProjectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      return updateProjectStatusOption(data.id, data);
   });

export const deleteProjectStatus = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => deleteProjectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      await deleteProjectStatusOption(data.id);
      return { ok: true };
   });

export const reorderProjectStatuses = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => reorderProjectOptionsSchema.parse(data))
   .handler(async ({ data }) => {
      await reorderProjectStatusOptions(data);
      return { ok: true };
   });

export const createProjectPriority = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => projectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      return createProjectPriorityOption(data);
   });

export const updateProjectPriority = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => updateProjectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      return updateProjectPriorityOption(data.id, data);
   });

export const deleteProjectPriority = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => deleteProjectOptionSchema.parse(data))
   .handler(async ({ data }) => {
      await deleteProjectPriorityOption(data.id);
      return { ok: true };
   });
