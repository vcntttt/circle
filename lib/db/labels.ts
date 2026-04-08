import { asc } from 'drizzle-orm';
import { db, schema } from './index';

export interface LabelListItem {
   id: string;
   name: string;
   color: string;
}

export async function getAllLabels(): Promise<LabelListItem[]> {
   if (!db) {
      return [];
   }

   return db
      .select({
         id: schema.labels.id,
         name: schema.labels.name,
         color: schema.labels.color,
      })
      .from(schema.labels)
      .orderBy(asc(schema.labels.name));
}
