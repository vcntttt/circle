import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/members')({
   beforeLoad: () => {
      throw redirect({ to: '/projects' });
   },
});
