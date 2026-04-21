import HeaderNav from './header-nav';
import HeaderOptions from './header-options';

interface HeaderProps {
   count: number;
   isConnected: boolean;
   projectTitle?: string;
}

export default function Header({ count, isConnected, projectTitle }: HeaderProps) {
   return (
      <div className="w-full flex flex-col items-center">
         <HeaderNav count={count} isConnected={isConnected} projectTitle={projectTitle} />
         <HeaderOptions />
      </div>
   );
}
