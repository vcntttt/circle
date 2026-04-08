import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/db/projects';

export async function GET() {
   try {
      const projects = await getAllProjects();

      return NextResponse.json(
         projects.map((project) => ({
            ...project,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
         }))
      );
   } catch (error) {
      console.error('Failed to load projects.', error);

      return NextResponse.json({ error: 'Failed to load projects.' }, { status: 500 });
   }
}
