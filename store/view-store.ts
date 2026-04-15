import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewType = 'list' | 'grid';
export type IssueDisplayProperty = 'labels' | 'project' | 'assignee' | 'createdAt';

interface ViewState {
   viewType: ViewType;
   visibleProperties: Record<IssueDisplayProperty, boolean>;
   setViewType: (viewType: ViewType) => void;
   toggleProperty: (property: IssueDisplayProperty) => void;
}

export const useViewStore = create<ViewState>()(
   persist(
      (set) => ({
         viewType: 'list',
         visibleProperties: {
            labels: true,
            project: true,
            assignee: true,
            createdAt: true,
         },
         setViewType: (viewType: ViewType) => set({ viewType }),
         toggleProperty: (property: IssueDisplayProperty) =>
            set((state) => ({
               visibleProperties: {
                  ...state.visibleProperties,
                  [property]: !state.visibleProperties[property],
               },
            })),
      }),
      {
         name: 'view-storage',
         storage: createJSONStorage(() => localStorage),
      }
   )
);
