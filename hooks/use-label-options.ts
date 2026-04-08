'use client';

import { useEffect, useState } from 'react';
import { LabelInterface } from '@/mock-data/labels';

export function useLabelOptions() {
   const [labels, setLabels] = useState<LabelInterface[]>([]);

   useEffect(() => {
      let isMounted = true;

      void fetch('/api/labels')
         .then(async (response) => {
            if (!response.ok) {
               throw new Error('Label request failed.');
            }

            const result = (await response.json()) as LabelInterface[];

            if (!isMounted) return;
            setLabels(result);
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
