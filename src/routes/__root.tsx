/// <reference types="vite/client" />

import type { ReactNode } from 'react';
import { HeadContent, Outlet, Scripts, createRootRoute, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import globalsCss from '@/src/styles/globals.css?url';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
   head: () => ({
      meta: [
         { charSet: 'utf-8' },
         { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
         { title: 'Circle' },
         {
            name: 'description',
            content:
               'Fork personal de Circle, una UI inspirada en Linear, recortada para gestionar proyectos, issues y etiquetas.',
         },
      ],
      links: [
         { rel: 'stylesheet', href: globalsCss },
         { rel: 'icon', type: 'image/svg+xml', href: '/images/icon.svg' },
      ],
   }),
   notFoundComponent: NotFoundComponent,
   component: RootComponent,
});

function RootComponent() {
   return (
      <RootDocument>
         <Outlet />
      </RootDocument>
   );
}

function RootDocument({ children }: { children: ReactNode }) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <HeadContent />
         </head>
         <body className="antialiased bg-background [--font-geist-sans:Inter,ui-sans-serif,system-ui,sans-serif] [--font-geist-mono:ui-monospace,SFMono-Regular,monospace]">
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
               {children}
               <Toaster />
            </ThemeProvider>
            <TanStackRouterDevtools position="bottom-right" />
            <Scripts />
         </body>
      </html>
   );
}

function NotFoundComponent() {
   return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-background text-foreground">
         <div className="w-full max-w-md rounded-lg border bg-card p-6 space-y-4 text-center">
            <h1 className="text-lg font-semibold">Page not found</h1>
            <p className="text-sm text-muted-foreground">
               The route does not exist in the personal Circle workspace.
            </p>
            <Link to="/projects" className="text-sm underline underline-offset-4">
               Go to projects
            </Link>
         </div>
      </div>
   );
}
