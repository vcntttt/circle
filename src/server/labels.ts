import { createServerFn } from '@tanstack/react-start';
import { getAllLabels } from '@/lib/db/labels';

export const getLabelOptions = createServerFn({ method: 'GET' }).handler(async () => {
   return getAllLabels();
});
