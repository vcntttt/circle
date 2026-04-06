interface HeaderOptionsProps {
   isConnected: boolean;
}

export default function HeaderOptions({ isConnected }: HeaderOptionsProps) {
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <p className="text-xs text-muted-foreground">
            Projects are now loaded from PostgreSQL instead of `mock-data/projects`.
         </p>
         <div
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
               isConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
            }`}
         >
            {isConnected ? 'Postgres connected' : 'Database unavailable'}
         </div>
      </div>
   );
}
