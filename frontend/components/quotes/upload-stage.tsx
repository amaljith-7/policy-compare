'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInsurers } from '@/hooks/use-insurers';
import { PRODUCT_TYPES } from '@/lib/constants';
import type { Insurer } from '@/lib/types';

interface UploadStageProps {
  onComplete: (data: {
    customerName: string;
    productType: string;
    uploads: Array<{ insurerId: string; insurerName: string; file: File }>;
  }) => void;
}

export function UploadStage({ onComplete }: UploadStageProps) {
  const [customerName, setCustomerName] = useState('');
  const [productType, setProductType] = useState('');
  const [uploads, setUploads] = useState<Record<string, File>>({});
  const { data: insurersData } = useInsurers(true);

  const insurers: Insurer[] = insurersData?.results || (Array.isArray(insurersData) ? insurersData : []);

  const handleFileChange = (insurerId: string, file: File | null) => {
    setUploads((prev) => {
      const next = { ...prev };
      if (file) {
        next[insurerId] = file;
      } else {
        delete next[insurerId];
      }
      return next;
    });
  };

  const handleDrop = (insurerId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileChange(insurerId, file);
    }
  };

  const uploadCount = Object.keys(uploads).length;
  const canProceed = customerName.trim() && productType && uploadCount >= 2;

  const handleProceed = () => {
    const uploadList = Object.entries(uploads).map(([insurerId, file]) => {
      const insurer = insurers.find((i) => i.id === insurerId);
      return { insurerId, insurerName: insurer?.name || '', file };
    });
    onComplete({ customerName, productType, uploads: uploadList });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Compare New Quote</h2>
        <p className="text-sm text-muted-foreground">Upload insurer PDFs to extract and compare quotes</p>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select value={productType} onValueChange={(value) => value && setProductType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Upload Insurer Quotes (min. 2)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {insurers.map((insurer) => {
              const file = uploads[insurer.id];
              return (
                <div
                  key={insurer.id}
                  className="border rounded-lg p-4 space-y-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(insurer.id, e)}
                >
                  <div className="flex items-center gap-2">
                    {insurer.logo ? (
                      <img src={insurer.logo} alt={insurer.name} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                        {insurer.name[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium truncate">{insurer.name}</span>
                  </div>
                  {file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate flex-1 text-muted-foreground">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleFileChange(insurer.id, null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-1 border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Drop PDF or click</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileChange(insurer.id, f);
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="border-t px-6 py-4 flex justify-end">
        <Button onClick={handleProceed} disabled={!canProceed}>
          Proceed ({uploadCount} PDFs selected)
        </Button>
      </div>
    </div>
  );
}
