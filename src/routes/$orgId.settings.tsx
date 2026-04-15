import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/settings')({
   beforeLoad: () => {
      throw redirect({ to: '/settings' });
   },
});
