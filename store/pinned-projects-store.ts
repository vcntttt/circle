import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PinnedProjectsState {
   pinnedProjectIds: string[];
   togglePinnedProject: (projectId: string) => void;
   isPinned: (projectId: string) => boolean;
}

export const usePinnedProjectsStore = create<PinnedProjectsState>()(
   persist(
      (set, get) => ({
         pinnedProjectIds: [],
         togglePinnedProject: (projectId: string) =>
            set((state) => {
               const exists = state.pinnedProjectIds.includes(projectId);

               return {
                  pinnedProjectIds: exists
                     ? state.pinnedProjectIds.filter((id) => id !== projectId)
                     : [...state.pinnedProjectIds, projectId],
               };
            }),
         isPinned: (projectId: string) => get().pinnedProjectIds.includes(projectId),
      }),
      {
         name: 'pinned-projects-storage',
         storage: createJSONStorage(() => localStorage),
      }
   )
);
