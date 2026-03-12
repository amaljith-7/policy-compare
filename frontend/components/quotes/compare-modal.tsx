'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UploadStage } from './upload-stage';
import { LoadingStage } from './loading-stage';
import { ComparisonStage } from './comparison-stage';
import { useQuote, useCreateQuote, useUpdateQuote } from '@/hooks/use-quotes';
import type { ComparisonData } from '@/lib/types';

type Stage = 'upload' | 'loading' | 'comparison';

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId?: string | null;
}

interface UploadData {
  customerName: string;
  productType: string;
  uploads: Array<{ insurerId: string; insurerName: string; file: File }>;
}

export function CompareModal({ open, onOpenChange, quoteId }: CompareModalProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [uploadData, setUploadData] = useState<UploadData | null>(null);

  const { data: existingQuote } = useQuote(quoteId || null);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

  // If viewing existing quote, skip to comparison
  useEffect(() => {
    if (quoteId && existingQuote) {
      setCurrentQuoteId(quoteId);
      setComparisonData(existingQuote.comparison_data);
      setStage('comparison');
    }
  }, [quoteId, existingQuote]);

  // Reset when modal opens fresh (no quoteId)
  useEffect(() => {
    if (open && !quoteId) {
      setStage('upload');
      setCurrentQuoteId(null);
      setComparisonData(null);
      setUploadData(null);
    }
  }, [open, quoteId]);

  const handleUploadComplete = (data: UploadData) => {
    setUploadData(data);
    setStage('loading');
  };

  const handleExtractionComplete = async (data: ComparisonData) => {
    setComparisonData(data);

    // Create quote in backend
    try {
      const result = await createQuote.mutateAsync({
        customer_name: uploadData!.customerName,
        product_type: uploadData!.productType,
        insurer_ids: uploadData!.uploads.map((u) => u.insurerId),
        status: 'NEW',
        comparison_data: data as unknown as Record<string, unknown>,
      });
      setCurrentQuoteId(result.id);
    } catch {
      // Quote still visible in comparison even if save fails
    }

    setStage('comparison');
  };

  const handleSave = useCallback(
    (data: ComparisonData) => {
      if (currentQuoteId) {
        updateQuote.mutate({
          id: currentQuoteId,
          data: { comparison_data: data as unknown as Record<string, unknown> },
        });
      }
      setComparisonData(data);
    },
    [currentQuoteId, updateQuote]
  );

  const handleClose = (openState: boolean) => {
    // Always save on close
    if (!openState && comparisonData && currentQuoteId) {
      updateQuote.mutate({
        id: currentQuoteId,
        data: { comparison_data: comparisonData as unknown as Record<string, unknown> },
      });
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        {stage === 'upload' && (
          <UploadStage onComplete={handleUploadComplete} />
        )}
        {stage === 'loading' && uploadData && (
          <LoadingStage
            uploads={uploadData.uploads}
            productType={uploadData.productType}
            onComplete={handleExtractionComplete}
          />
        )}
        {stage === 'comparison' && comparisonData && (
          <ComparisonStage
            data={comparisonData}
            quoteId={currentQuoteId}
            onSave={handleSave}
            customerName={uploadData?.customerName || existingQuote?.customer_name || ''}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
