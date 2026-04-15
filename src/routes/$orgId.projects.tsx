import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/projects')({
   beforeLoad: () => {
      throw redirect({ to: '/projects' });
   },
});
