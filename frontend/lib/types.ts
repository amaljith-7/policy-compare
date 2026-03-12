export interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  is_default: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role | null;
  role_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Record<string, boolean>;
  is_superuser?: boolean;
}

export interface Insurer {
  id: string;
  name: string;
  logo: string | null;
  is_enabled: boolean;
  created_at: string;
}

export type QuoteStatus = 'NEW' | 'SUBMITTED' | 'IN_DISCUSSION' | 'HOLD' | 'CLOSED_WON' | 'CLOSED_LOST';

export type ProductType = 'MOTOR' | 'BUSINESS' | 'HEALTH' | 'LIFE';

export interface ExtractionField {
  key: string;
  label: string;
  value: string;
}

export interface InsurerData {
  insurer_id: string;
  insurer_name: string;
  fields: Record<string, string>;
}

export interface ComparisonData {
  fields: Array<{ key: string; label: string }>;
  insurers: InsurerData[];
}

export interface Quote {
  id: string;
  quote_no: string;
  quote_number: number;
  customer_name: string;
  product_type: ProductType;
  insurers: Insurer[];
  status: QuoteStatus;
  owned_by: User;
  notes: string;
  comparison_data: ComparisonData;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardData {
  total_quotes: number;
  by_status: Record<string, number>;
  by_product: Record<string, number>;
  recent_quotes: Quote[];
  by_agent: Array<{ owned_by__full_name: string; owned_by__id: string; count: number }>;
}
