import type { Status } from '@/lib/models';
import type { Project } from '@/lib/models';
import { create } from 'zustand';

interface CreateIssueState {
   isOpen: boolean;
   defaultStatus: Status | null;
   defaultProject: Project | null;

   // Actions
   openModal: (status?: Status, project?: Project) => void;
   closeModal: () => void;
   setDefaultStatus: (status: Status | null) => void;
   setDefaultProject: (project: Project | null) => void;
}

export const useCreateIssueStore = create<CreateIssueState>((set, get) => ({
   // Initial state
   isOpen: false,
   defaultStatus: null,
   defaultProject: null,

   // Actions
   openModal: (status, project) =>
      set({
         isOpen: true,
         defaultStatus: status || null,
         defaultProject: project === undefined ? get().defaultProject : (project ?? null),
      }),
   closeModal: () => set({ isOpen: false }),
   setDefaultStatus: (status) => set({ defaultStatus: status }),
   setDefaultProject: (project) => set({ defaultProject: project }),
}));
