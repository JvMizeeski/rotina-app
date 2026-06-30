import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean spaces and potential literal quotes from copy-paste mistakes in GitHub Secrets
const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const cleanAnonKey = rawAnonKey.trim().replace(/^["']|["']$/g, '');

let isConfigured = Boolean(cleanUrl && cleanAnonKey);
let client = null;

if (isConfigured) {
  try {
    // Validate if the URL has a valid protocol to avoid crash inside createClient
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('A URL do Supabase precisa começar com http:// ou https://');
    }
    client = createClient(cleanUrl, cleanAnonKey);
  } catch (err) {
    console.error('Erro catastrófico ao inicializar o cliente do Supabase:', err);
    isConfigured = false;
    client = null;
  }
}

// Check if variables are configured
export const isSupabaseConfigured = isConfigured;

// Create Supabase client (only if credentials exist, otherwise null)
export const supabase = client;

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
  comentario: string;
}
