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
  usuario_id?: string;
  created_at?: string;
}

export interface RegistroDiario {
  id: string;
  habito_id: string;
  data: string; // YYYY-MM-DD
  concluido: boolean;
  horas_dedicadas: number;
  comentario: string;
  usuario_id?: string;
}

// Utility to format decimal hours into friendly representation (e.g. 0.75h -> 45m, 1.5h -> 1h 30m)
export function formatHorasDedicadas(horas: number): string {
  if (!horas || horas <= 0) return '0m';
  const totalMinutos = Math.round(horas * 60);
  if (totalMinutos < 60) {
    return `${totalMinutos}m`;
  }
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

// Get local date string in YYYY-MM-DD format (respecting local timezone, like Brasilia)
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
