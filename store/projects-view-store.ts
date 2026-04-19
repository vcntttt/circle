import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ProjectDisplayProperty = 'health' | 'priority' | 'lead' | 'targetDate' | 'status';

interface ProjectsViewState {
   visibleProperties: Record<ProjectDisplayProperty, boolean>;
   toggleProperty: (property: ProjectDisplayProperty) => void;
}

export const useProjectsViewStore = create<ProjectsViewState>()(
   persist(
      (set) => ({
         visibleProperties: {
            health: true,
            priority: true,
            lead: true,
            targetDate: true,
            status: true,
         },
         toggleProperty: (property: ProjectDisplayProperty) =>
            set((state) => ({
               visibleProperties: {
                  ...state.visibleProperties,
                  [property]: !state.visibleProperties[property],
               },
            })),
      }),
      {
         name: 'projects-view-storage',
         storage: createJSONStorage(() => localStorage),
      }
   )
);
