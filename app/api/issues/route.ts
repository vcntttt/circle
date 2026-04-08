import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createIssueRecord } from '@/lib/db/issues';

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

export async function POST(request: Request) {
   try {
      const body = await request.json();
      const payload = createIssueSchema.parse(body);
      const issue = await createIssueRecord(payload);

      return NextResponse.json(issue, { status: 201 });
   } catch (error) {
      console.error('Failed to create issue.', error);

      return NextResponse.json({ error: 'Failed to create issue.' }, { status: 400 });
   }
}
