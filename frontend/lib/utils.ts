import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QUOTE_STATUSES } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatQuoteNo(quoteNumber: number): string {
  return `QT-${String(quoteNumber).padStart(3, '0')}`;
}

export function getStatusColor(status: string): string {
  return QUOTE_STATUSES[status]?.color || 'bg-gray-100 text-gray-800';
}
