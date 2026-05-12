import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewType = 'list' | 'grid';
export type IssueDisplayProperty = 'identifier' | 'labels' | 'project' | 'assignee' | 'createdAt';

interface ViewState {
   viewType: ViewType;
   showEmptyStatuses: boolean;
   hideCompletedIssues: boolean;
   visibleProperties: Record<IssueDisplayProperty, boolean>;
   setViewType: (viewType: ViewType) => void;
   setShowEmptyStatuses: (showEmptyStatuses: boolean) => void;
   setHideCompletedIssues: (hideCompletedIssues: boolean) => void;
   toggleProperty: (property: IssueDisplayProperty) => void;
}

export const useViewStore = create<ViewState>()(
   persist(
      (set) => ({
         viewType: 'list',
         showEmptyStatuses: true,
         hideCompletedIssues: false,
         visibleProperties: {
            identifier: true,
            labels: true,
            project: true,
            assignee: true,
            createdAt: true,
         },
         setViewType: (viewType: ViewType) => set({ viewType }),
         setShowEmptyStatuses: (showEmptyStatuses: boolean) => set({ showEmptyStatuses }),
         setHideCompletedIssues: (hideCompletedIssues: boolean) => set({ hideCompletedIssues }),
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
         merge: (persistedState, currentState) => {
            const persisted = persistedState as Partial<ViewState> | undefined;

            return {
               ...currentState,
               ...persisted,
               visibleProperties: {
                  ...currentState.visibleProperties,
                  ...persisted?.visibleProperties,
               },
            };
         },
      }
   )
);
