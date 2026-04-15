import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/inbox')({
   beforeLoad: () => {
      throw redirect({ to: '/issues' });
   },
});
