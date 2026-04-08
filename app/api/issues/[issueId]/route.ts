import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateIssueRecord } from '@/lib/db/issues';

const updateIssueSchema = z
   .object({
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

export async function PATCH(
   request: Request,
   { params }: { params: Promise<{ issueId: string }> }
) {
   try {
      const body = await request.json();
      const payload = updateIssueSchema.parse(body);
      const { issueId } = await params;
      const issue = await updateIssueRecord(issueId, payload);

      if (!issue) {
         return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
      }

      return NextResponse.json(issue);
   } catch (error) {
      console.error('Failed to update issue.', error);

      return NextResponse.json({ error: 'Failed to update issue.' }, { status: 400 });
   }
}
