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
   updateProjectDetailsRecord,
   updateProjectPriorityOption,
   updateProjectRecord,
   updateProjectStatusOption,
} from '@/lib/db/projects';
import type { ProjectLatestUpdate, ProjectTimelineUpdate } from '@/lib/db/projects';

const createProjectSchema = z
   .object({
      name: z.string().trim().min(2).max(120),
      key: z.string().trim().max(10).optional(),
      description: z.string().trim().max(500).optional(),
      iconType: z.enum(['lucide', 'emoji']).optional(),
      iconValue: z.string().trim().max(80).optional(),
      status: z.string().trim().min(1),
      priority: z.string().trim().min(1).optional(),
   })
   .superRefine((value, ctx) => {
      if (value.iconType === undefined && value.iconValue === undefined) {
         return;
      }

      const iconType = value.iconType ?? 'lucide';
      const iconValue = value.iconValue?.trim() ?? '';

      if (!iconValue) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['iconValue'],
            message: 'Project icon is required.',
         });
         return;
      }

      if (iconType === 'emoji' && iconValue.length > 8) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['iconValue'],
            message: 'Emoji icon must be 8 characters or fewer.',
         });
      }
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

const updateProjectDetailsSchema = z
   .object({
      projectId: z.string().trim().min(1),
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(500).nullable().optional(),
      iconType: z.enum(['lucide', 'emoji']).optional(),
      iconValue: z.string().trim().max(80).optional(),
   })
   .refine(
      (value) =>
         value.name !== undefined ||
         value.description !== undefined ||
         value.iconType !== undefined ||
         value.iconValue !== undefined,
      {
         message: 'At least one project detail must be provided.',
      }
   )
   .superRefine((value, ctx) => {
      if (value.iconType === undefined && value.iconValue === undefined) {
         return;
      }

      const iconType = value.iconType ?? 'lucide';
      const iconValue = value.iconValue?.trim() ?? '';

      if (!iconValue) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['iconValue'],
            message: 'Project icon is required.',
         });
         return;
      }

      if (iconType === 'emoji' && iconValue.length > 8) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['iconValue'],
            message: 'Emoji icon must be 8 characters or fewer.',
         });
      }
   });

const normalizeIconPayload = <T extends { iconType?: 'lucide' | 'emoji'; iconValue?: string }>(
   payload: T
) => {
   if (payload.iconType === undefined && payload.iconValue === undefined) {
      return payload;
   }

   const iconType = payload.iconType ?? 'lucide';
   const rawValue = payload.iconValue?.trim() ?? '';
   const iconValue =
      iconType === 'lucide'
         ? rawValue
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
         : rawValue;

   if (!iconValue) {
      throw new Error('Project icon is required.');
   }

   if (iconType === 'emoji' && iconValue.length > 8) {
      throw new Error('Emoji icon must be 8 characters or fewer.');
   }

   if (iconType === 'lucide' && iconValue.length > 80) {
      throw new Error('Lucide icon name must be 80 characters or fewer.');
   }

   return {
      ...payload,
      iconType,
      iconValue,
   };
};

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
      const project = await createProjectRecord(normalizeIconPayload(data));

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

export const updateProjectDetails = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => updateProjectDetailsSchema.parse(data))
   .handler(async ({ data }) => {
      const { projectId, ...payload } = data;
      const project = await updateProjectDetailsRecord(projectId, normalizeIconPayload(payload));

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
