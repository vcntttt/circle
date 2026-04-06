import { SidebarTrigger } from '@/components/ui/sidebar';
import { CreateProjectDialog } from '@/components/common/projects/create-project-dialog';

interface HeaderNavProps {
   count: number;
   isConnected: boolean;
}

export default function HeaderNav({ count, isConnected }: HeaderNavProps) {
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Projects</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{count}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <CreateProjectDialog disabled={!isConnected} />
         </div>
      </div>
   );
}
