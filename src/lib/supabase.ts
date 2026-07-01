import { createClient } from '@supabase/supabase-js';

// Real credentials provided by the user used as robust defaults
const defaultUrl = 'https://gggertjmpapjixxygdfu.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ2VydGptcGFwaml4eHlnZGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzI2ODUsImV4cCI6MjA5ODQwODY4NX0.LO-oazjqMa2nVF5XUkOw5FA2iCUmkcm0UeUrd5f10OE';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

// Clean spaces and potential literal quotes from copy-paste mistakes
let cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const cleanAnonKey = rawAnonKey.trim().replace(/^["']|["']$/g, '');

if (cleanUrl) {
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    if (!cleanUrl.includes('.')) {
      cleanUrl = `https://${cleanUrl}.supabase.co`;
    } else {
      cleanUrl = `https://${cleanUrl}`;
    }
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  // If the user pasted the API URL (e.g. ending with /rest/v1), strip it out
  cleanUrl = cleanUrl.replace(/\/rest\/v1$/, '');
  cleanUrl = cleanUrl.replace(/\/+$/, '');
}

let isConfigured = Boolean(cleanUrl && cleanAnonKey);
let client = null;

if (isConfigured) {
  try {
    client = createClient(cleanUrl, cleanAnonKey);
  } catch (err) {
    console.error('Erro catastrófico ao inicializar o cliente do Supabase:', err);
    isConfigured = false;
    client = null;
  }
}

// Check if variables are configured
export const isSupabaseConfigured = isConfigured;

// Create Supabase client
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
