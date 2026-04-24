'use client';

import { updateProject as updateProjectMutation } from '@/src/server/projects';

export async function persistProjectUpdate(
   projectId: string,
   input: { status?: string; priority?: string }
) {
   return updateProjectMutation({ data: { projectId, ...input } });
}
