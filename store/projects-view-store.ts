import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ProjectDisplayProperty = 'health' | 'priority' | 'lead' | 'targetDate' | 'status';
export type ProjectViewType = 'list' | 'board';
export type ProjectBoardGroupBy = 'status' | 'priority' | 'health';

interface ProjectsViewState {
   viewType: ProjectViewType;
   groupBy: ProjectBoardGroupBy;
   showEmptyGroups: boolean;
   visibleProperties: Record<ProjectDisplayProperty, boolean>;
   setViewType: (viewType: ProjectViewType) => void;
   setGroupBy: (groupBy: ProjectBoardGroupBy) => void;
   setShowEmptyGroups: (showEmptyGroups: boolean) => void;
   toggleProperty: (property: ProjectDisplayProperty) => void;
}

export const useProjectsViewStore = create<ProjectsViewState>()(
   persist(
      (set) => ({
         viewType: 'list',
         groupBy: 'status',
         showEmptyGroups: false,
         visibleProperties: {
            health: true,
            priority: true,
            lead: true,
            targetDate: true,
            status: true,
         },
         setViewType: (viewType: ProjectViewType) => set({ viewType }),
         setGroupBy: (groupBy: ProjectBoardGroupBy) => set({ groupBy }),
         setShowEmptyGroups: (showEmptyGroups: boolean) => set({ showEmptyGroups }),
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
