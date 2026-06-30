import { supabase, isSupabaseConfigured, Habito, RegistroDiario } from './supabase';

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
          id: `r_${habit.id}_${dateStr}`,
          habito_id: habit.id,
          data: dateStr,
          concluido: true,
          horas_dedicadas: habit.categoria === 'Estudos' ? 1.5 : habit.categoria === 'Saúde' ? 0.5 : 1.0,
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
      id: existingIndex >= 0 ? registers[existingIndex].id : `r_${registro.habito_id}_${registro.data}`,
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
};
