import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
   createIssueRecord,
   getIssueByIdentifier,
   getIssuesPageData,
   updateIssueRecord,
} from '@/lib/db/issues';

const createIssueSchema = z.object({
   identifier: z.string().trim().min(1),
   title: z.string().trim().min(1),
   description: z.string().trim().optional(),
   status: z.string().trim().min(1),
   priority: z.string().trim().min(1),
   assigneeId: z.string().trim().nullable().optional(),
   rank: z.string().trim().min(1),
   dueDate: z.string().trim().nullable().optional(),
   projectName: z.string().trim().nullable().optional(),
   labelNames: z.array(z.string().trim().min(1)).optional(),
});

const updateIssueSchema = z
   .object({
      issueId: z.string().trim().min(1),
      status: z.string().trim().min(1).optional(),
      priority: z.string().trim().min(1).optional(),
      assigneeId: z.string().trim().nullable().optional(),
      dueDate: z.string().trim().nullable().optional(),
      projectName: z.string().trim().nullable().optional(),
      labelNames: z.array(z.string().trim().min(1)).optional(),
   })
   .refine(
      (value) =>
         value.status !== undefined ||
         value.priority !== undefined ||
         value.assigneeId !== undefined ||
         value.dueDate !== undefined ||
         value.projectName !== undefined ||
         value.labelNames !== undefined,
      {
         message: 'At least one issue field must be provided.',
      }
   );

export const createIssue = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => createIssueSchema.parse(data))
   .handler(async ({ data }) => {
      return createIssueRecord(data);
   });

export const updateIssue = createServerFn({ method: 'POST' })
   .inputValidator((data: unknown) => updateIssueSchema.parse(data))
   .handler(async ({ data }) => {
      const { issueId, ...payload } = data;
      return updateIssueRecord(issueId, payload);
   });

export const getIssuesPage = createServerFn({ method: 'GET' }).handler(async () => {
   return getIssuesPageData();
});

export const getIssueDetail = createServerFn({ method: 'GET' })
   .inputValidator((data: unknown) =>
      z.object({ issueIdentifier: z.string().trim().min(1) }).parse(data)
   )
   .handler(async ({ data }) => {
      return getIssueByIdentifier(data.issueIdentifier);
   });
