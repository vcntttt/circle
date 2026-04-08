import { FolderKanban, Box, Settings, Layers, Zap, UserRound } from 'lucide-react';

export const workspaceItems = [
   {
      name: 'Issues',
      url: '/issues',
      icon: FolderKanban,
   },
   {
      name: 'Projects',
      url: '/projects',
      icon: Box,
   },
];

export const accountItems = [
   {
      name: 'General',
      url: '/settings#general',
      icon: UserRound,
   },
   {
      name: 'Core setup',
      url: '/settings#general',
      icon: Settings,
   },
   {
      name: 'Integrations',
      url: '/settings#integrations',
      icon: Zap,
   },
];

export const featuresItems = [
   {
      name: 'Projects',
      url: '/settings#general',
      icon: Box,
   },
   {
      name: 'Database',
      url: '/settings#database',
      icon: Layers,
   },
   {
      name: 'Integrations',
      url: '/settings#integrations',
      icon: Zap,
   },
];
