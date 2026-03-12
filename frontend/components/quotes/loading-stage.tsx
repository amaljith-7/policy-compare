'use client';

import { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useExtractPdf } from '@/hooks/use-quotes';
import { DEFAULT_EXTRACTION_FIELDS } from '@/lib/constants';
import type { ComparisonData } from '@/lib/types';

interface LoadingStageProps {
  uploads: Array<{ insurerId: string; insurerName: string; file: File }>;
  productType: string;
  onComplete: (data: ComparisonData) => void;
}

export function LoadingStage({ uploads, productType, onComplete }: LoadingStageProps) {
  const extractPdf = useExtractPdf();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const extractAll = async () => {
      const results = await Promise.all(
        uploads.map(async (upload) => {
          try {
            const result = await extractPdf.mutateAsync({
              pdf: upload.file,
              insurer_id: upload.insurerId,
              product_type: productType,
            });
            return {
              insurer_id: upload.insurerId,
              insurer_name: upload.insurerName,
              fields: result.fields,
            };
          } catch {
            // Return empty fields on failure
            const emptyFields: Record<string, string> = {};
            DEFAULT_EXTRACTION_FIELDS.forEach((f) => {
              emptyFields[f.key] = 'Extraction failed';
            });
            return {
              insurer_id: upload.insurerId,
              insurer_name: upload.insurerName,
              fields: emptyFields,
            };
          }
        })
      );

      const comparisonData: ComparisonData = {
        fields: DEFAULT_EXTRACTION_FIELDS.map((f) => ({ key: f.key, label: f.label })),
        insurers: results,
      };

      onComplete(comparisonData);
    };

    extractAll();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Extracting Data...</h2>
        <p className="text-sm text-muted-foreground">
          Processing {uploads.length} PDFs with AI. This may take a moment.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {uploads.map((upload) => (
            <div key={upload.insurerId} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-sm font-medium">
                {upload.insurerName[0]}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{upload.insurerName}</p>
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
