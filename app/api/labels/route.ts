import { NextResponse } from 'next/server';
import { getAllLabels } from '@/lib/db/labels';

export async function GET() {
   try {
      const labels = await getAllLabels();

      return NextResponse.json(labels);
   } catch (error) {
      console.error('Failed to load labels.', error);

      return NextResponse.json({ error: 'Failed to load labels.' }, { status: 500 });
   }
}
