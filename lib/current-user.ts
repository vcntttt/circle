import type { User } from '@/lib/models';

const avatarUrl = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

export const statusUserColors = {
   online: '#00cc66',
   offline: '#969696',
   away: '#ffcc00',
};

export const currentUser: User = {
   id: 'me',
   name: 'vcntttt',
   avatarUrl: avatarUrl('vcntttt'),
   email: 'local@circle.dev',
   status: 'online',
   role: 'Admin',
   joinedDate: '2026-01-01',
   teamIds: [],
};

export const personalAssigneeOptions: User[] = [currentUser];

export const personalMemberOptions: User[] = [currentUser];

export function resolveCurrentAssignee(assigneeId: string | null | undefined): User | null {
   if (!assigneeId) {
      return null;
   }

   return currentUser;
}
