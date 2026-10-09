export type License = {
  id: string;
  user_id: string;
  email: string;
  key: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'inactive' | 'expired';
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  email: string;
  amount: number;
  currency: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'paid' | 'rejected';
  reference_number?: string;
  created_at: string;
  confirmed_at?: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  payment_id?: string;
  email: string;
  amount: number;
  currency: string;
  invoice_number: string;
  status: 'pending' | 'sent' | 'paid';
  created_at: string;
  sent_at?: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export const PLAN_PRICES = {
  monthly: 499,
  quarterly: 1499,
  yearly: 3999
};

export const PLAN_DURATION_DAYS = {
  monthly: 30,
  quarterly: 90,
  yearly: 365
};
