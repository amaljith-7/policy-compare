export const PRODUCT_TYPES = [
  { value: 'MOTOR', label: 'Motor Insurance' },
  { value: 'BUSINESS', label: 'Business Insurance' },
  { value: 'HEALTH', label: 'Health Insurance' },
  { value: 'LIFE', label: 'Life Insurance' },
] as const;

export const QUOTE_STATUSES: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-blue-500/15 text-blue-700 font-medium' },
  SUBMITTED: { label: 'Submitted', color: 'bg-purple-500/15 text-purple-700 font-medium' },
  IN_DISCUSSION: { label: 'In Discussion', color: 'bg-yellow-500/15 text-yellow-700 font-medium' },
  HOLD: { label: 'Hold', color: 'bg-orange-500/15 text-orange-700 font-medium' },
  CLOSED_WON: { label: 'Closed Won', color: 'bg-green-500/15 text-green-700 font-medium' },
  CLOSED_LOST: { label: 'Closed Lost', color: 'bg-red-500/15 text-red-700 font-medium' },
};

export const PERMISSIONS = {
  QUOTES_VIEW: 'quotes.view',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_EDIT: 'quotes.edit',
  QUOTES_DELETE: 'quotes.delete',
  QUOTES_SHARE: 'quotes.share',
  INSURERS_VIEW: 'insurers.view',
  INSURERS_MANAGE: 'insurers.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  DASHBOARD_VIEW: 'dashboard.view',
} as const;

export const DEFAULT_EXTRACTION_FIELDS = [
  { key: 'customer', label: 'Customer', order: 0 },
  { key: 'insured_name', label: 'Insured Name', order: 1 },
  { key: 'email', label: 'Email', order: 2 },
  { key: 'mobile_number', label: 'Mobile Number', order: 3 },
  { key: 'policy_type', label: 'Policy Type', order: 4 },
  { key: 'premium', label: 'Premium', order: 5 },
  { key: 'vat_5_percent', label: 'VAT 5%', order: 6 },
  { key: 'excess', label: 'Excess', order: 7 },
  { key: 'total_payable', label: 'Total Payable', order: 8 },
  { key: 'insured_value', label: 'Insured Value', order: 9 },
] as const;

export const ITEMS_PER_PAGE = 20;
