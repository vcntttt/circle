'use client';

import { useEffect, useState } from 'react';
import type { LabelInterface } from '@/lib/models';
import { getLabelOptions } from '@/src/server/labels';

export function useLabelOptions() {
   const [labels, setLabels] = useState<LabelInterface[]>([]);

   useEffect(() => {
      let isMounted = true;

      void getLabelOptions()
         .then((result) => {
            if (!isMounted) return;
            setLabels(result as LabelInterface[]);
         })
         .catch((error) => {
            console.error('Failed to load label options.', error);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return labels;
}
