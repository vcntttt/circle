import type { ComponentType, FC, SVGProps } from 'react';

export interface LabelInterface {
   id: string;
   name: string;
   color: string;
}

export interface User {
   id: string;
   name: string;
   avatarUrl: string;
   email: string;
   status: 'online' | 'offline' | 'away';
   role: 'Member' | 'Admin' | 'Guest';
   joinedDate: string;
   teamIds: string[];
}

export interface Status {
   id: string;
   name: string;
   color: string;
   icon: FC;
}

export interface Priority {
   id: string;
   name: string;
   icon: FC<SVGProps<SVGSVGElement>>;
}

export interface Health {
   id: 'no-update' | 'off-track' | 'on-track' | 'at-risk';
   name: string;
   color: string;
   description: string;
}

export interface Project {
   id: string;
   name: string;
   status: Status;
   icon: ComponentType<{ className?: string; size?: string | number }>;
   percentComplete: number;
   startDate: string;
   lead: User;
   priority: Priority;
   health: Health;
}

export interface Issue {
   id: string;
   identifier: string;
   title: string;
   description: string;
   status: Status;
   assignee: User | null;
   priority: Priority;
   labels: LabelInterface[];
   createdAt: string;
   cycleId: string;
   project?: Project;
   subissues?: string[];
   rank: string;
   dueDate?: string;
}

export interface SidebarItem {
   name: string;
   url: string;
   icon: ComponentType<{ className?: string; size?: string | number }>;
}
