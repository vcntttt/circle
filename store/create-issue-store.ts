import type { Issue, Project, Status } from '@/lib/models';
import { create } from 'zustand';

interface CreateIssueState {
   isOpen: boolean;
   defaultStatus: Status | null;
   defaultProject: Project | null;
   defaultParentIssue: Pick<Issue, 'id' | 'identifier' | 'title'> | null;

   // Actions
   openModal: (
      status?: Status,
      project?: Project,
      parentIssue?: Pick<Issue, 'id' | 'identifier' | 'title'> | null
   ) => void;
   closeModal: () => void;
   setDefaultStatus: (status: Status | null) => void;
   setDefaultProject: (project: Project | null) => void;
   setDefaultParentIssue: (parentIssue: Pick<Issue, 'id' | 'identifier' | 'title'> | null) => void;
}

export const useCreateIssueStore = create<CreateIssueState>((set, get) => ({
   // Initial state
   isOpen: false,
   defaultStatus: null,
   defaultProject: null,
   defaultParentIssue: null,

   // Actions
   openModal: (status, project, parentIssue) =>
      set({
         isOpen: true,
         defaultStatus: status || null,
         defaultProject: project === undefined ? get().defaultProject : (project ?? null),
         defaultParentIssue: parentIssue ?? null,
      }),
   closeModal: () => set({ isOpen: false }),
   setDefaultStatus: (status) => set({ defaultStatus: status }),
   setDefaultProject: (project) => set({ defaultProject: project }),
   setDefaultParentIssue: (parentIssue) => set({ defaultParentIssue: parentIssue }),
}));
