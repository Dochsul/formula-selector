import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, brand:brands(*), category:formula_categories(*), barcodes:product_barcodes(*)')
    .eq('status', 'verified')
    .limit(200);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getProductByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*, product:products(*, brand:brands(*), category:formula_categories(*))')
    .eq('barcode', barcode)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveClinicalDecision(input: unknown, result: unknown) {
  const { error } = await supabase.from('clinical_decisions').insert({
    symptom_input: input,
    decision: result,
    rule_version: '1.0.0'
  });

  if (error) {
    throw error;
  }
}
