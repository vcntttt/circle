import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/issues')({
   beforeLoad: () => {
      throw redirect({ to: '/issues' });
   },
});
