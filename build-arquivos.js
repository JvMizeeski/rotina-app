import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES Modules environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define files and their contents
const files = [
  {
    filePath: 'package.json',
    content: `{
  "name": "habitracker-mobile",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "gh-pages": "^6.3.0",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2"
  }
}`
  },
  {
    filePath: 'vite.config.ts',
    content: `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});`
  },
  {
    filePath: 'src/vite-env.d.ts',
    content: `/// <reference types="vite/client" />`
  },
  {
    filePath: 'src/lib/supabase.ts',
    content: `import { createClient } from '@supabase/supabase-js';

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
}`
  },
  {
    filePath: 'src/lib/dataService.ts',
    content: `import { supabase, isSupabaseConfigured, Habito, RegistroDiario } from './supabase';

// Local storage keys
const LOCAL_HABITS_KEY = 'habitracker_habitos';
const LOCAL_REGISTERS_KEY = 'habitracker_registros';

// Initial sample habits for LocalStorage mode
const SAMPLE_HABITS: Habito[] = [
  { id: 'h1', nome: 'Beber 2L de Água', categoria: 'Saúde', meta_semanal: 7 },
  { id: 'h2', nome: 'Treinar / Exercício', categoria: 'Saúde', meta_semanal: 4 },
  { id: 'h3', nome: 'Estudar Programação', categoria: 'Estudos', meta_semanal: 5 },
  { id: 'h4', nome: 'Leitura Noturna', categoria: 'Mente', meta_semanal: 5 },
  { id: 'h5', nome: 'Meditação Guiada', categoria: 'Mente', meta_semanal: 3 },
];

// Initial sample registers for the last few days to make the Dashboard look amazing right away
const getSampleRegisters = (habits: Habito[]): RegistroDiario[] => {
  const registers: RegistroDiario[] = [];
  const today = new Date();
  
  // Fill history for the last 5 days
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    habits.forEach((habit, index) => {
      // Complete randomly to make graphs beautiful
      const isCompleted = (index + i) % 2 === 0;
      if (isCompleted) {
        registers.push({
          id: \`r_\${habit.id}_\${dateStr}\`,
          habito_id: habit.id,
          data: dateStr,
          concluido: true,
          horas_dedicadas: habit.categoria === 'Estudos' ? 1.5 : habit.categoria === 'Saúde' ? 0.5 : 1.0,
          nota_humor: Math.floor(Math.random() * 3) + 3, // 3 to 5
          comentario: 'Mantendo o foco diário! ✨'
        });
      }
    });
  }
  return registers;
};

// Initialize localStorage if empty
const initializeLocalStorage = () => {
  if (!localStorage.getItem(LOCAL_HABITS_KEY)) {
    localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(SAMPLE_HABITS));
    const sampleRegs = getSampleRegisters(SAMPLE_HABITS);
    localStorage.setItem(LOCAL_REGISTERS_KEY, JSON.stringify(sampleRegs));
  }
};

export const dataService = {
  // --- HABITS ---
  async getHabitos(): Promise<Habito[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('habitos')
          .select('*')
          .order('nome', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar hábitos no Supabase. Fallback para LocalStorage:', err);
      }
    }
    
    // Fallback to LocalStorage
    initializeLocalStorage();
    const habitsStr = localStorage.getItem(LOCAL_HABITS_KEY);
    return habitsStr ? JSON.parse(habitsStr) : [];
  },

  async addHabito(nome: string, categoria: string, meta_semanal: number): Promise<Habito> {
    const newHabit: Habito = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      nome,
      categoria,
      meta_semanal
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('habitos')
          .insert([{ nome, categoria, meta_semanal }])
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error('Erro ao salvar hábito no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage write
    initializeLocalStorage();
    const habits = await this.getHabitos();
    const updatedHabits = [...habits, newHabit];
    localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(updatedHabits));
    return newHabit;
  },

  async deleteHabito(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // First delete registers for this habit
        await supabase.from('registros_diarios').delete().eq('habito_id', id);
        
        const { error } = await supabase
          .from('habitos')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Erro ao deletar hábito no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage delete
    initializeLocalStorage();
    const habits = await this.getHabitos();
    const filteredHabits = habits.filter(h => h.id !== id);
    localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(filteredHabits));

    // Clean up registers
    const registersStr = localStorage.getItem(LOCAL_REGISTERS_KEY);
    if (registersStr) {
      const registers: RegistroDiario[] = JSON.parse(registersStr);
      const filteredRegisters = registers.filter(r => r.habito_id !== id);
      localStorage.setItem(LOCAL_REGISTERS_KEY, JSON.stringify(filteredRegisters));
    }

    return true;
  },

  // --- REGISTERS ---
  async getRegistros(startDateStr: string, endDateStr: string): Promise<RegistroDiario[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_diarios')
          .select('*')
          .gte('data', startDateStr)
          .lte('data', endDateStr);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar registros no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage read
    initializeLocalStorage();
    const regStr = localStorage.getItem(LOCAL_REGISTERS_KEY);
    const registers: RegistroDiario[] = regStr ? JSON.parse(regStr) : [];
    return registers.filter(r => r.data >= startDateStr && r.data <= endDateStr);
  },

  async saveRegistro(registro: Omit<RegistroDiario, 'id'>): Promise<RegistroDiario> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Check if there is already a record for this habit on this day
        const { data: existing, error: findError } = await supabase
          .from('registros_diarios')
          .select('id')
          .eq('habito_id', registro.habito_id)
          .eq('data', registro.data)
          .maybeSingle();

        if (findError) throw findError;

        if (existing) {
          // Update
          const { data, error } = await supabase
            .from('registros_diarios')
            .update({
              concluido: registro.concluido,
              horas_dedicadas: registro.horas_dedicadas,
              nota_humor: registro.nota_humor,
              comentario: registro.comentario
            })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        } else {
          // Insert
          const { data, error } = await supabase
            .from('registros_diarios')
            .insert([registro])
            .select()
            .single();
          if (error) throw error;
          return data;
        }
      } catch (err) {
        console.error('Erro ao salvar registro no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage write
    initializeLocalStorage();
    const regStr = localStorage.getItem(LOCAL_REGISTERS_KEY);
    const registers: RegistroDiario[] = regStr ? JSON.parse(regStr) : [];
    
    const existingIndex = registers.findIndex(
      r => r.habito_id === registro.habito_id && r.data === registro.data
    );

    const updatedRegistro: RegistroDiario = {
      id: existingIndex >= 0 ? registers[existingIndex].id : \`r_\${registro.habito_id}_\${registro.data}\`,
      ...registro
    };

    if (existingIndex >= 0) {
      registers[existingIndex] = updatedRegistro;
    } else {
      registers.push(updatedRegistro);
    }

    localStorage.setItem(LOCAL_REGISTERS_KEY, JSON.stringify(registers));
    return updatedRegistro;
  }
};`
  },
  {
    filePath: 'src/pages/Checklist.tsx',
    content: `import { useState, useEffect, FormEvent, MouseEvent } from 'react';
import { Plus, Calendar, Smile, BookOpen, Clock, Check, ChevronDown, ChevronUp, Trash2, ShieldAlert } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, isSupabaseConfigured } from '../lib/supabase';

export default function Checklist() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<Record<string, RegistroDiario>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Expanded states for habit detail forms
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // New Habit Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCategoria, setNewCategoria] = useState('Saúde');
  const [newMetaSemanal, setNewMetaSemanal] = useState(5);

  // Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const allHabits = await dataService.getHabitos();
      setHabitos(allHabits);

      // Fetch registers for the single selected day
      const dailyRegs = await dataService.getRegistros(selectedDate, selectedDate);
      
      // Convert to a dictionary for faster lookups: habit_id -> registry
      const regMap: Record<string, RegistroDiario> = {};
      dailyRegs.forEach(reg => {
        regMap[reg.habito_id] = reg;
      });
      setRegistros(regMap);
    } catch (err) {
      console.error(err);
      showBanner('Erro ao carregar dados.');
    }
  };

  const showBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleConcluido = async (habitId: string) => {
    const isCurrentlyDone = registros[habitId]?.concluido || false;
    const currentReg = registros[habitId] || {
      habito_id: habitId,
      data: selectedDate,
      concluido: false,
      horas_dedicadas: 0,
      nota_humor: 5,
      comentario: ''
    };

    const updatedReg = {
      ...currentReg,
      concluido: !isCurrentlyDone
    };

    try {
      const saved = await dataService.saveRegistro(updatedReg);
      setRegistros(prev => ({
        ...prev,
        [habitId]: saved
      }));
      
      if (!isCurrentlyDone) {
        showBanner('Hábito concluído! Bom trabalho! 🎉');
      }
    } catch (err) {
      console.error(err);
      showBanner('Erro ao salvar registro.');
    }
  };

  const handleSaveDetails = async (habitId: string, horas: number, humor: number, comment: string) => {
    const currentReg = registros[habitId] || {
      habito_id: habitId,
      data: selectedDate,
      concluido: false,
      horas_dedicadas: 0,
      nota_humor: 5,
      comentario: ''
    };

    const updatedReg = {
      ...currentReg,
      horas_dedicadas: horas,
      nota_humor: humor,
      comentario: comment,
      concluido: true // auto-conclude when details are updated/saved
    };

    try {
      const saved = await dataService.saveRegistro(updatedReg);
      setRegistros(prev => ({
        ...prev,
        [habitId]: saved
      }));
      setExpandedHabitId(null);
      showBanner('Detalhes salvos com sucesso! 💪');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao salvar detalhes.');
    }
  };

  const handleAddHabitoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      const added = await dataService.addHabito(newNome, newCategoria, newMetaSemanal);
      setHabitos(prev => [...prev, added]);
      setIsAddModalOpen(false);
      setNewNome('');
      setNewCategoria('Saúde');
      setNewMetaSemanal(5);
      showBanner('Novo hábito adicionado! 🚀');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao adicionar hábito.');
    }
  };

  const handleDeleteHabito = async (habitId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este hábito e todo o seu histórico?')) {
      try {
        await dataService.deleteHabito(habitId);
        setHabitos(prev => prev.filter(h => h.id !== habitId));
        // remove from local register state
        const updatedRegs = { ...registros };
        delete updatedRegs[habitId];
        setRegistros(updatedRegs);
        showBanner('Hábito removido com sucesso.');
      } catch (err) {
        console.error(err);
        showBanner('Erro ao remover hábito.');
      }
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Saúde': return 'from-emerald-600 to-teal-500 text-emerald-100';
      case 'Estudos': return 'from-blue-600 to-indigo-500 text-blue-100';
      case 'Mente': return 'from-purple-600 to-fuchsia-500 text-purple-100';
      case 'Trabalho': return 'from-amber-600 to-orange-500 text-amber-100';
      default: return 'from-zinc-600 to-slate-500 text-zinc-100';
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Saúde': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Estudos': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Mente': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Trabalho': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const emojis = ['😢', '😕', '😐', '🙂', '🤩'];

  return (
    <div className="pb-24 animate-fade-in" id="page-checklist">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Minha Rotina</h1>
            <p className="text-xs text-zinc-400 font-mono">
              {isSupabaseConfigured ? '⚡ Sincronizado com Supabase' : '📱 Modo Offline Local (Demonstração)'}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-transform active:scale-95 text-sm cursor-pointer shadow-lg shadow-emerald-500/20"
            id="btn-add-habit"
          >
            <Plus size={18} />
            <span>Novo</span>
          </button>
        </div>

        {/* Cloud Warning if not Configured */}
        {!isSupabaseConfigured && (
          <div className="flex items-start gap-3 p-3 text-xs border rounded-xl bg-amber-500/10 border-amber-500/20 text-amber-400 leading-relaxed font-sans">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Modo Demo Local Ativo:</span> Crie o arquivo <code className="bg-zinc-950 px-1 py-0.5 rounded text-amber-200">.env</code> com <code className="text-amber-200">VITE_SUPABASE_URL</code> e <code className="text-amber-200">VITE_SUPABASE_ANON_KEY</code> para salvar na nuvem!
            </div>
          </div>
        )}

        {/* Date Selector Banner */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-400" size={20} />
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 font-mono">DATA DE REGISTRO</span>
              <span className="text-sm font-semibold text-white">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
            id="input-date-picker"
          />
        </div>
      </div>

      {/* Habits Checklist Area */}
      {habitos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-8">
          <BookOpen className="text-zinc-600 mb-3" size={36} />
          <p className="text-sm text-zinc-300 font-medium">Nenhum hábito cadastrado ainda.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Toque no botão "Novo" no canto superior direito para criar o seu primeiro hábito!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4.5">
          {habitos.map((habit) => {
            const isCompleted = registros[habit.id]?.concluido || false;
            const isExpanded = expandedHabitId === habit.id;
            const itemReg = registros[habit.id] || {
              horas_dedicadas: 0,
              nota_humor: 5,
              comentario: ''
            };

            return (
              <div
                key={habit.id}
                className={\`group rounded-2xl border transition-all duration-300 overflow-hidden \${
                  isCompleted
                    ? 'bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-500/30 shadow-md shadow-emerald-950/10'
                    : 'bg-zinc-900 border-zinc-800/60'
                }\`}
                id={\`habit-card-\${habit.id}\`}
              >
                {/* Master click area */}
                <div 
                  className="flex items-center justify-between p-4.5 gap-3 cursor-pointer select-none active:bg-zinc-800/20"
                  onClick={() => handleToggleConcluido(habit.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={\`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 \${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950 text-transparent'
                      }\`}
                    >
                      <Check size={20} strokeWidth={3.5} className={isCompleted ? 'block' : 'opacity-0'} />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={\`text-base font-semibold leading-snug truncate transition-colors \${
                          isCompleted ? 'text-emerald-300' : 'text-zinc-200'
                        }\`}
                      >
                        {habit.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={\`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold \${getCategoryBadgeColor(habit.categoria)}\`}>
                          {habit.categoria}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Meta: {habit.meta_semanal}x / sem
                        </span>
                        {itemReg.horas_dedicadas > 0 && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-1">
                            <Clock size={10} /> {itemReg.horas_dedicadas}h
                          </span>
                        )}
                        {itemReg.nota_humor > 0 && isCompleted && (
                          <span className="text-[10px] bg-zinc-950/50 border border-zinc-800 px-1.5 py-0.5 rounded-full">
                            {emojis[itemReg.nota_humor - 1]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    <button
                      onClick={(e) => handleDeleteHabito(habit.id, e)}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Drawer to log detail fields */}
                {isExpanded && (
                  <HabitFormFields
                    initialHoras={itemReg.horas_dedicadas}
                    initialHumor={itemReg.nota_humor}
                    initialComment={itemReg.comentario}
                    onSave={(horas, humor, comment) => handleSaveDetails(habit.id, horas, humor, comment)}
                    onClose={() => setExpandedHabitId(null)}
                    emojis={emojis}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/30 text-emerald-300 px-5 py-3 rounded-full text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
          {notification}
        </div>
      )}

      {/* Add Habit Overlay Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Adicionar Novo Hábito</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHabitoSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">NOME DO HÁBITO</label>
                <input
                  type="text"
                  required
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Ler livro, Fazer Cardio, Meditar..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">CATEGORIA</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Saúde">💪 Saúde</option>
                    <option value="Estudos">📚 Estudos</option>
                    <option value="Mente">🧘 Mente</option>
                    <option value="Trabalho">💼 Trabalho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">META SEMANAL</label>
                  <select
                    value={newMetaSemanal}
                    onChange={(e) => setNewMetaSemanal(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(v => (
                      <option key={v} value={v}>{v}x na semana</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 active:scale-95 transition-all text-sm mt-2"
              >
                Criar Hábito
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface HabitFormFieldsProps {
  initialHoras: number;
  initialHumor: number;
  initialComment: string;
  onSave: (horas: number, humor: number, comment: string) => void;
  onClose: () => void;
  emojis: string[];
}

function HabitFormFields({
  initialHoras,
  initialHumor,
  initialComment,
  onSave,
  onClose,
  emojis
}: HabitFormFieldsProps) {
  const [horas, setHoras] = useState(initialHoras || 0);
  const [humor, setHumor] = useState(initialHumor || 5);
  const [comment, setComment] = useState(initialComment || '');

  return (
    <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
            <Clock size={14} className="text-emerald-400" /> Horas Dedicadas
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHoras(Math.max(0, horas - 0.5))}
              className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center text-sm font-bold border border-zinc-800 text-zinc-300"
            >
              -
            </button>
            <span className="text-sm font-bold text-white font-mono w-12 text-center">{horas}h</span>
            <button
              type="button"
              onClick={() => setHoras(horas + 0.5)}
              className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center text-sm font-bold border border-zinc-800 text-zinc-300"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <span className="block text-xs text-zinc-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <Smile size={14} className="text-emerald-400" /> Humor do Dia
          </span>
          <div className="grid grid-cols-5 gap-1 bg-zinc-900 p-1 rounded-xl">
            {emojis.map((emoji, idx) => {
              const value = idx + 1;
              const isSelected = humor === value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHumor(value)}
                  className={\`py-2 rounded-lg text-lg transition-transform duration-200 active:scale-95 \${
                    isSelected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 scale-105'
                      : 'hover:bg-zinc-800 border border-transparent'
                  }\`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">Nota ou Comentário</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Como foi seu desempenho hoje?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onSave(horas, humor, comment)}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all text-xs cursor-pointer text-center"
        >
          Salvar Detalhes
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-all text-xs border border-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}`
  },
  {
    filePath: 'src/pages/Dashboard.tsx',
    content: `import { useState, useEffect } from 'react';
import { Calendar, Award, Star, Clock, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario } from '../lib/supabase';

export default function Dashboard() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = monday.toISOString().split('T')[0];
    const endStr = sunday.toISOString().split('T')[0];

    setWeekRange({ start: startStr, end: endStr });
    loadData(startStr, endStr);
  }, []);

  const loadData = async (start: string, end: string) => {
    try {
      setLoading(true);
      const allHabits = await dataService.getHabitos();
      const allRegs = await dataService.getRegistros(start, end);
      
      setHabitos(allHabits);
      setRegistros(allRegs);
    } catch (err) {
      console.error('Erro ao buscar dados no Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedCount = (habitId: string) => {
    return registros.filter(r => r.habito_id === habitId && r.concluido).length;
  };

  const getTotalHours = () => {
    return registros.reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);
  };

  const getAverageMood = () => {
    const moods = registros.filter(r => r.nota_humor > 0).map(r => r.nota_humor);
    if (moods.length === 0) return 0;
    const avg = moods.reduce((sum, val) => sum + val, 0) / moods.length;
    return Number(avg.toFixed(1));
  };

  const getOverallCompletionRate = () => {
    if (habitos.length === 0) return 0;
    const totalPossibleConcl = habitos.reduce((acc, h) => acc + h.meta_semanal, 0);
    if (totalPossibleConcl === 0) return 0;
    const totalDone = habitos.reduce((acc, h) => acc + Math.min(getCompletedCount(h.id), h.meta_semanal), 0);
    return Math.round((totalDone / totalPossibleConcl) * 100);
  };

  const getCategoryTagStyle = (cat: string) => {
    switch (cat) {
      case 'Saúde': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Estudos': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Mente': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Trabalho': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const emojis = ['😢', '😕', '😐', '🙂', '🤩'];
  const moodEmoji = getAverageMood() > 0 ? emojis[Math.round(getAverageMood()) - 1] : '🧘';

  return (
    <div className="pb-24 animate-fade-in" id="page-dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Progresso Semanal</h1>
        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-mono uppercase">
          <Calendar size={12} className="text-emerald-400" />
          Período: {weekRange.start ? new Date(weekRange.start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''} - {weekRange.end ? new Date(weekRange.end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between">
          <span className="text-[9px] text-zinc-400 uppercase font-bold font-mono">Consistência</span>
          <div className="my-2 text-xl font-extrabold text-emerald-400 flex items-center justify-center gap-1">
            <Award size={18} />
            <span>{getOverallCompletionRate()}%</span>
          </div>
          <span className="text-[8px] text-zinc-500 leading-tight">Da meta total</span>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between">
          <span className="text-[9px] text-zinc-400 uppercase font-bold font-mono">Dedicação</span>
          <div className="my-2 text-xl font-extrabold text-blue-400 flex items-center justify-center gap-1">
            <Clock size={18} />
            <span>{getTotalHours()}h</span>
          </div>
          <span className="text-[8px] text-zinc-500 leading-tight">Focadas esta semana</span>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between">
          <span className="text-[9px] text-zinc-400 uppercase font-bold font-mono">Humor Médio</span>
          <div className="my-2 text-xl font-extrabold text-purple-400 flex items-center justify-center gap-1">
            <span className="text-lg">{moodEmoji}</span>
            <span>{getAverageMood() || '-'}</span>
          </div>
          <span className="text-[8px] text-zinc-500 leading-tight">Média de humor</span>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
          <Sparkles size={14} className="text-emerald-400" /> Metas Semanais por Hábito
        </h2>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs font-mono">Carregando métricas...</div>
        ) : habitos.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">Sem hábitos para monitorar. Cadastre-os na tela de Checklist!</div>
        ) : (
          <div className="flex flex-col gap-5">
            {habitos.map((habit) => {
              const doneCount = getCompletedCount(habit.id);
              const target = habit.meta_semanal;
              const percent = Math.min(100, Math.round((doneCount / target) * 100));
              const isGoalMet = doneCount >= target;

              return (
                <div key={habit.id} className="group" id={\`dashboard-habit-\${habit.id}\`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0 pr-2">
                      <span className="text-sm font-semibold text-zinc-200 block truncate group-hover:text-white transition-colors">
                        {habit.nome}
                      </span>
                      <span className={\`inline-block text-[9px] px-1.5 py-0.5 rounded border mt-0.5 font-mono \${getCategoryTagStyle(habit.categoria)}\`}>
                        {habit.categoria}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={\`text-xs font-extrabold font-mono \${isGoalMet ? 'text-emerald-400' : 'text-zinc-400'}\`}>
                        {doneCount} de {target} dias
                      </span>
                      <span className="text-[9px] block text-zinc-500 font-mono">
                        {isGoalMet ? '🏆 Cumprida!' : \`\${percent}% completo\`}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden relative p-0.5">
                    <div
                      className={\`h-full rounded-full transition-all duration-700 ease-out-back \${
                        isGoalMet
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/25'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }\`}
                      style={{ width: \`\${Math.max(4, percent)}%\` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
        <Star className="text-emerald-400 shrink-0" size={18} />
        <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
          Cada pequeno passo conta! Hábitos concluídos ajudam a reprogramar sua rotina diária para o sucesso. Mantenha as barras <span className="text-emerald-400 font-bold">verdes</span>!
        </p>
      </div>
    </div>
  );
}`
  },
  {
    filePath: 'src/pages/Export.tsx',
    content: `import { useState } from 'react';
import { FileText, Copy, Check, Brain, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';

export default function Export() {
  const [markdown, setMarkdown] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      setCopied(false);

      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 6);

      const startStr = pastDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      const [habitos, registros] = await Promise.all([
        dataService.getHabitos(),
        dataService.getRegistros(startStr, endStr)
      ]);

      if (habitos.length === 0) {
        setMarkdown('### Nenhum hábito cadastrado no sistema ainda. Adicione hábitos na tela principal para gerar relatórios!');
        return;
      }

      let md = \`# 📊 RELATÓRIO SEMANAL DE HÁBITOS E ROTINA\\n\`;
      md += \`**Período:** \${new Date(startStr + 'T12:00:00').toLocaleDateString('pt-BR')} até \${new Date(endStr + 'T12:00:00').toLocaleDateString('pt-BR')}\\n\`;
      md += \`**Gerado em:** \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\\n\\n\`;

      const completedRegs = registros.filter(r => r.concluido);
      const totalHours = registros.reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);
      const validMoods = registros.filter(r => r.nota_humor > 0).map(r => r.nota_humor);
      const avgMood = validMoods.length > 0 ? (validMoods.reduce((s, m) => s + m, 0) / validMoods.length).toFixed(1) : 'N/A';

      md += \`## 📈 RESUMO GERAL\\n\`;
      md += \`- **Check-ins Concluídos:** \${completedRegs.length} vezes nesta semana\\n\`;
      md += \`- **Tempo Total Focado:** \${totalHours} horas dedicadas\\n\`;
      md += \`- **Média de Humor:** \${avgMood} / 5.0\\n\\n\`;

      md += \`## 🗂️ DESEMPENHO POR HÁBITO\\n\`;
      
      habitos.forEach((habit) => {
        const habitRegs = registros.filter(r => r.habito_id === habit.id);
        const doneCount = habitRegs.filter(r => r.concluido).length;
        const target = habit.meta_semanal;
        const percent = target > 0 ? Math.round((doneCount / target) * 100) : 0;
        
        md += \`### 🔹 \${habit.nome} [\${habit.categoria}]\\n\`;
        md += \`- **Meta Semanal:** \${target} vezes | **Realizado:** \${doneCount} vezes (\${percent}%)\\n\`;
        
        const doneRegs = habitRegs.filter(r => r.concluido);
        if (doneRegs.length > 0) {
          md += \`- **Logs Diários:**\\n\`;
          doneRegs.forEach(reg => {
            const dateFormatted = new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const moodMap = ['😢 Pessimista', '😕 Desanimado', '😐 Neutro', '🙂 Produtivo', '🤩 Excelente'];
            const moodLabel = reg.nota_humor > 0 ? moodMap[reg.nota_humor - 1] : 'Sem registro';
            
            md += \`  - **[\${dateFormatted}]** Concluído | Dedicado: \${reg.horas_dedicadas}h | Humor: \${moodLabel}\\n\`;
            if (reg.comentario) {
              md += \`    *Nota:* "\${reg.comentario}"\\n\`;
            }
          });
        } else {
          md += \`- *Nenhum check-in registrado para este hábito nos últimos 7 dias.*\\n\`;
        }
        md += \`\\n\`;
      });

      md += \`---\\n\`;
      md += \`## 🤖 SOLICITAÇÃO DE ANÁLISE IA (COPIE COM O TEXTO ACIMA)\\n\`;
      md += \`*Olá Gemini! Analise o meu relatório de rotina e hábitos acima. Identifique padrões de comportamento, gargalos de produtividade, correlações entre humor e dedicação horária, e me recomende 3 ações práticas personalizadas para otimizar minha consistência na próxima semana.*\`;

      setMarkdown(md);
    } catch (err) {
      console.error(err);
      setMarkdown('Erro ao compilar o relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="pb-24 animate-fade-in" id="page-export">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Relatório de Desempenho</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Gere relatórios em Markdown prontos para enviar para o Gemini e receber mentoria.
        </p>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 mb-6 flex flex-col items-center text-center">
        <FileText className="text-emerald-400 mb-3" size={32} />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Exportação para Inteligência Artificial</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Nossa engine compila todas as métricas semanais e anotações subjetivas em um padrão consolidado de alta performance.
        </p>
        
        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 transition-all active:scale-98 mt-5 text-xs uppercase tracking-wider font-mono shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          id="btn-generate-report"
        >
          {loading ? 'Compilando Métricas...' : 'Gerar Relatório Semanal'}
        </button>
      </div>

      {markdown && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-400" /> Prévia do Markdown
            </span>
            <button
              onClick={handleCopy}
              className={\`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border \${
                copied
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
              }\`}
              id="btn-copy-report"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar Relatório</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <textarea
              readOnly
              value={markdown}
              className="w-full h-80 p-4 font-mono text-[10px] text-zinc-300 bg-transparent resize-none focus:outline-none leading-relaxed select-text"
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 mt-2">
            <Brain className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">Como usar com a IA?</h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                Toque no botão <span className="text-emerald-400 font-bold">Copiar Relatório</span> acima, vá para o Gemini, cole o relatório gerado e envie. Ele dará uma análise profunda do seu comportamento corporal, intelectual e mental!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`
  },
  {
    filePath: 'src/App.tsx',
    content: `import { useState } from 'react';
import Checklist from './pages/Checklist';
import Dashboard from './pages/Dashboard';
import Export from './pages/Export';
import { CheckSquare, BarChart3, FileText, Sparkles } from 'lucide-react';

type TabType = 'checklist' | 'dashboard' | 'export';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'checklist':
        return <Checklist />;
      case 'dashboard':
        return <Dashboard />;
      case 'export':
        return <Export />;
      default:
        return <Checklist />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900" id="app-root">
      <div className="w-full max-w-md mx-auto min-h-screen bg-zinc-950 border-x border-zinc-900 flex flex-col relative px-5 pt-6 pb-24 shadow-2xl">
        
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles size={16} className="text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest font-sans uppercase">AuraTrack</h2>
            <p className="text-[9px] text-zinc-500 tracking-wider font-mono uppercase">Alta Consistência Mobile</p>
          </div>
        </div>

        <main className="flex-1">
          {renderActivePage()}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800/80 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-around h-20 px-4">
            
            <button
              onClick={() => setActiveTab('checklist')}
              className={\`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer \${
                activeTab === 'checklist'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }\`}
              id="tab-nav-checklist"
            >
              <CheckSquare size={20} strokeWidth={activeTab === 'checklist' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Hábitos</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={\`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer \${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }\`}
              id="tab-nav-dashboard"
            >
              <BarChart3 size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Estatísticas</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={\`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer \${
                activeTab === 'export'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }\`}
              id="tab-nav-export"
            >
              <FileText size={20} strokeWidth={activeTab === 'export' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Relatório</span>
            </button>

          </div>
        </nav>

      </div>
    </div>
  );
}`
  },
  {
    filePath: 'src/index.css',
    content: `@import "tailwindcss";

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-up {
  animation: slideUp 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
}`
  },
  {
    filePath: 'src/main.tsx',
    content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`
  }
];

console.log('🚀 Iniciando a geração de arquivos do Habit Tracker...');

files.forEach((file) => {
  const fullPath = path.join(__dirname, file.filePath);
  const dirName = path.dirname(fullPath);

  // Recursively create directory if it doesn't exist
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
    console.log(\`📁 Diretório criado: \${path.relative(__dirname, dirName)}\`);
  }

  // Write content
  fs.writeFileSync(fullPath, file.content, 'utf8');
  console.log(\`✅ Arquivo criado: \${file.filePath}\`);
});

console.log('\\n🎉 Todos os arquivos foram criados com sucesso!');
console.log('Consulte as instruções anexas para rodar a aplicação localmente.');
