import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$orgId/issues/$issueIdentifier')({
   beforeLoad: ({ params }) => {
      throw redirect({
         to: '/issues/$issueIdentifier',
         params: { issueIdentifier: params.issueIdentifier },
      });
   },
});
