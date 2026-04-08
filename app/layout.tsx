import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

const siteUrl = 'https://github.com/vcntttt/circle';

export const metadata: Metadata = {
   title: {
      template: '%s | Circle Personal Fork',
      default: 'Circle Personal Fork',
   },
   description:
      'Fork personal de Circle, una UI inspirada en Linear, recortada para gestionar proyectos, issues y etiquetas.',
   openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: 'Circle Personal Fork',
      images: [
         {
            url: `${siteUrl}/banner.png`,
            width: 2560,
            height: 1440,
            alt: 'Circle Personal Fork',
         },
      ],
   },
   twitter: {
      card: 'summary_large_image',
      images: [
         {
            url: `${siteUrl}/banner.png`,
            width: 2560,
            height: 1440,
            alt: 'Circle Personal Fork',
         },
      ],
   },
   authors: [{ name: 'vcntttt', url: 'https://github.com/vcntttt/circle' }],
   keywords: ['circle', 'linear-inspired', 'personal tracker', 'issues', 'projects'],
};

import { ThemeProvider } from '@/components/layout/theme-provider';

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
         </head>
         <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
               {children}
               <Toaster />
            </ThemeProvider>
         </body>
      </html>
   );
}
