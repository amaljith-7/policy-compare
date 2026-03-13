'use client';

import { Download, Share2, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useShareQuote } from '@/hooks/use-quotes';
import { generateComparisonPdf } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import type { ComparisonData } from '@/lib/types';

interface ShareActionsProps {
  quoteId: string | null;
  comparisonData: ComparisonData;
  customerName: string;
}

export function ShareActions({ quoteId, comparisonData, customerName }: ShareActionsProps) {
  const shareQuote = useShareQuote();

  const handleDownloadPdf = async () => {
    try {
      await generateComparisonPdf(customerName);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = async () => {
    await handleDownloadPdf();
    if (quoteId) {
      shareQuote.mutate(quoteId);
    }
    const text = encodeURIComponent(`Hi, please find the insurance comparison for ${customerName}.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = async () => {
    await handleDownloadPdf();
    if (quoteId) {
      shareQuote.mutate(quoteId);
    }
    const subject = encodeURIComponent(`Insurance Quote Comparison - ${customerName}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find attached the insurance comparison for ${customerName}.\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadPdf}>
          <Download />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <MessageCircle />
          Share via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareEmail}>
          <Mail />
          Share via Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
