import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Check if variables are configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client (only if credentials exist, otherwise null)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Standard TypeScript types for our tables
export interface Habito {
  id: string;
  nome: string;
  categoria: string;
  meta_semanal: number; // number of times per week
  created_at?: string;
}

export interface RegistroDiario {
  id: string;
  habito_id: string;
  data: string; // YYYY-MM-DD
  concluido: boolean;
  horas_dedicadas: number;
  nota_humor: number; // 1 to 5
  comentario: string;
}
