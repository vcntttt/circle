import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/team/$teamId/all')({
   beforeLoad: () => {
      throw redirect({ to: '/issues' });
   },
});
