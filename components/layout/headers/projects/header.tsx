import HeaderNav from './header-nav';
import HeaderOptions from './header-options';

interface HeaderProps {
   count: number;
   isConnected: boolean;
}

export default function Header({ count, isConnected }: HeaderProps) {
   return (
      <div className="w-full flex flex-col items-center">
         <HeaderNav count={count} isConnected={isConnected} />
         <HeaderOptions />
      </div>
   );
}
