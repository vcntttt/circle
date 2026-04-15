import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId')({
   beforeLoad: () => {
      throw redirect({ to: '/projects' });
   },
});
