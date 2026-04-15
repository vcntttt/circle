'use client';

import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare, Paperclip, Send } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toPresentationIssue } from '@/lib/issues-presentation';
import { IssueListItem } from '@/lib/db/issues';
import { LabelBadge } from './label-badge';
import { ProjectBadge } from './project-badge';
import { PrioritySelector } from './priority-selector';
import { StatusSelector } from './status-selector';
import { AssigneeUser } from './assignee-user';

export function IssueDetail({ issue }: { issue: IssueListItem }) {
   const presentationIssue = toPresentationIssue(issue);

   return (
      <div className="flex flex-col h-full">
         <div className="flex items-center justify-between px-4 h-10 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
               <SidebarTrigger className="inline-flex lg:hidden" />
               <Button variant="ghost" size="xs" asChild>
                  <Link to="/issues">
                     <ArrowLeft className="size-4" />
                     Back
                  </Link>
               </Button>
               <span className="text-sm font-medium truncate">{presentationIssue.identifier}</span>
            </div>

            <div className="flex items-center gap-2">
               <PrioritySelector
                  priority={presentationIssue.priority}
                  issueId={presentationIssue.id}
               />
               <StatusSelector status={presentationIssue.status} issueId={presentationIssue.id} />
            </div>
         </div>

         <div className="pt-10 pb-6 px-4 space-y-6 w-full max-w-4xl mx-auto overflow-y-auto">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
               <span className="text-sm font-medium text-muted-foreground">
                  {presentationIssue.identifier}
               </span>
               <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">
                     Created {format(new Date(presentationIssue.createdAt), 'MMM dd, yyyy')}
                  </span>
               </div>
            </div>

            <div className="space-y-3">
               <h1 className="text-2xl font-semibold text-foreground">{presentationIssue.title}</h1>
               <div className="flex flex-wrap items-center gap-2">
                  <PrioritySelector
                     priority={presentationIssue.priority}
                     issueId={presentationIssue.id}
                  />
                  <StatusSelector
                     status={presentationIssue.status}
                     issueId={presentationIssue.id}
                  />
                  <AssigneeUser user={presentationIssue.assignee} issueId={presentationIssue.id} />
                  {presentationIssue.project && (
                     <ProjectBadge project={presentationIssue.project} />
                  )}
                  <LabelBadge label={presentationIssue.labels} />
               </div>
            </div>

            <div className="prose prose-sm max-w-none">
               <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {presentationIssue.description || 'No description yet.'}
               </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
               <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Activity
               </div>
               <p className="text-sm text-muted-foreground">
                  This issue detail replaces the old inbox preview surface. Comments and activity
                  can be added here later without bringing back the inbox workflow.
               </p>
            </div>

            <div className="relative w-full flex flex-col mt-8">
               <Textarea
                  className="w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent pb-14 resize-none"
                  placeholder="Leave a note..."
                  rows={3}
               />
               <div className="absolute right-3 bottom-3 flex items-center gap-3">
                  <Button size="icon" variant="ghost">
                     <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary">
                     <Send className="w-4 h-4" />
                  </Button>
               </div>
            </div>
         </div>
      </div>
   );
}
