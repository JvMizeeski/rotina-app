import { supabase, isSupabaseConfigured, Habito, RegistroDiario, getLocalDateString } from './supabase';

// Local storage keys
const LOCAL_HABITS_KEY = 'habitracker_habitos';
const LOCAL_REGISTERS_KEY = 'habitracker_registros';
const LOCAL_USERS_KEY = 'habitracker_users';

// Initial sample habits for LocalStorage mode
const SAMPLE_HABITS: Habito[] = [
  { id: 'h1', nome: 'Beber 2L de Água', categoria: 'Saúde', meta_semanal: 7 },
  { id: 'h2', nome: 'Treinar / Exercício', categoria: 'Saúde', meta_semanal: 4 },
  { id: 'h3', nome: 'Estudar Programação', categoria: 'Estudos', meta_semanal: 5 },
  { id: 'h4', nome: 'Leitura Noturna', categoria: 'Mente', meta_semanal: 5 },
  { id: 'h5', nome: 'Meditação Guiada', categoria: 'Mente', meta_semanal: 3 },
];

// Initial sample registers for the last few days to make the Dashboard look amazing right away
const getSampleRegisters = (habits: Habito[], usuarioId: string): RegistroDiario[] => {
  const registers: RegistroDiario[] = [];
  const today = new Date();
  
  // Fill history for the last 5 days
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    
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
          comentario: 'Mantendo o foco diário! ✨',
          usuario_id: usuarioId
        });
      }
    });
  }
  return registers;
};

// Helper to strip sensitive fields (like password) from user objects returned to client
export function sanitizeUser(user: any) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

export const dataService = {
  // --- AUTH SYSTEM (SIMPLE LOGIN/SIGNUP) ---
  
  async login(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const cleanUser = username.toLowerCase().trim();
    if (!cleanUser || !password) {
      return { success: false, error: 'Preencha usuário e senha.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('username', cleanUser)
          .maybeSingle();
        
        if (error) throw error;
        
        if (!data) {
          return { success: false, error: 'Usuário não cadastrado.' };
        }
        
        if (data.password !== password) {
          return { success: false, error: 'Senha incorreta.' };
        }
        
        return { success: true, user: sanitizeUser(data) };
      } catch (err: any) {
        console.error('Erro ao fazer login no Supabase:', err);
      }
    }
    
    // Fallback Local Storage Auth
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const found = localUsers.find((u: any) => u.username === cleanUser);
    
    if (!found) {
      return { success: false, error: 'Usuário não cadastrado localmente.' };
    }
    if (found.password !== password) {
      return { success: false, error: 'Senha incorreta.' };
    }
    
    return { success: true, user: sanitizeUser(found) };
  },

  async signup(username: string, password: string, displayName: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const cleanUser = username.toLowerCase().trim();
    if (!cleanUser || !password || !displayName) {
      return { success: false, error: 'Preencha todos os campos.' };
    }
    
    if (isSupabaseConfigured && supabase) {
      try {
        // Check if username already exists
        const { data: existing, error: checkError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('username', cleanUser)
          .maybeSingle();
        
        if (checkError) throw checkError;
        if (existing) {
          return { success: false, error: 'Este usuário já está cadastrado.' };
        }
        
        const { data, error } = await supabase
          .from('usuarios')
          .insert([{ username: cleanUser, password, display_name: displayName }])
          .select('id, username, display_name, created_at')
          .single();
          
        if (error) throw error;
        return { success: true, user: sanitizeUser(data) };
      } catch (err: any) {
        console.error('Erro ao cadastrar usuário no Supabase:', err);
        return { success: false, error: 'Erro ao conectar ao banco de dados.' };
      }
    }
    
    // Fallback Local Storage Signup
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const exists = localUsers.some((u: any) => u.username === cleanUser);
    
    if (exists) {
      return { success: false, error: 'Este usuário já está cadastrado localmente.' };
    }
    
    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      username: cleanUser,
      password,
      display_name: displayName,
      created_at: new Date().toISOString()
    };
    
    localUsers.push(newUser);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    return { success: true, user: sanitizeUser(newUser) };
  },

  async updatePerfil(usuarioId: string, displayName: string, novaSenha?: string): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!displayName) {
      return { success: false, error: 'Nome de exibição não pode ser vazio.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updateData: any = { display_name: displayName };
        if (novaSenha) {
          updateData.password = novaSenha;
        }
        
        const { data, error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('username', usuarioId)
          .select('id, username, display_name, created_at')
          .single();
          
        if (error) throw error;
        return { success: true, user: sanitizeUser(data) };
      } catch (err: any) {
        console.error('Erro ao atualizar perfil no Supabase:', err);
        return { success: false, error: 'Erro ao atualizar perfil no banco de dados.' };
      }
    }
    
    // LocalStorage fallback
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const index = localUsers.findIndex((u: any) => u.username === usuarioId);
    if (index >= 0) {
      localUsers[index].display_name = displayName;
      if (novaSenha) {
        localUsers[index].password = novaSenha;
      }
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      return { success: true, user: sanitizeUser(localUsers[index]) };
    }
    return { success: false, error: 'Usuário não encontrado localmente.' };
  },

  async zerarDadosUsuario(usuarioId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('registros_diarios').delete().eq('usuario_id', usuarioId);
        await supabase.from('habitos').delete().eq('usuario_id', usuarioId);
        return true;
      } catch (err) {
        console.error('Erro ao zerar dados no Supabase:', err);
      }
    }
    
    // LocalStorage
    localStorage.removeItem(`${LOCAL_HABITS_KEY}_${usuarioId}`);
    localStorage.removeItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`);
    return true;
  },

  // --- HABITS ---
  async getHabitos(usuarioId: string): Promise<Habito[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('habitos')
          .select('*')
          .eq('usuario_id', usuarioId);
        if (error) throw error;
        
        // Return sorted: if 'ordem' field is present, sort by it first, then by 'nome'
        const rawList = data || [];
        return rawList.sort((a: any, b: any) => {
          const orderA = a.ordem !== undefined && a.ordem !== null ? a.ordem : 0;
          const orderB = b.ordem !== undefined && b.ordem !== null ? b.ordem : 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return a.nome.localeCompare(b.nome);
        });
      } catch (err) {
        console.error('Erro ao buscar hábitos no Supabase. Fallback para LocalStorage:', err);
      }
    }
    
    // Fallback to LocalStorage
    const habitsStr = localStorage.getItem(`${LOCAL_HABITS_KEY}_${usuarioId}`);
    if (!habitsStr) {
      // Seed with default habits for this specific user
      const userSample = SAMPLE_HABITS.map((h, i) => ({
        ...h,
        id: `local_${usuarioId}_${h.id}`,
        ordem: i,
        usuario_id: usuarioId
      }));
      localStorage.setItem(`${LOCAL_HABITS_KEY}_${usuarioId}`, JSON.stringify(userSample));
      return userSample;
    }
    return JSON.parse(habitsStr);
  },

  async addHabito(nome: string, categoria: string, meta_semanal: number, usuarioId: string): Promise<Habito> {
    const habits = await this.getHabitos(usuarioId);
    
    // Determine the next order index
    const maxOrdem = habits.reduce((max, h) => {
      const o = h.ordem !== undefined && h.ordem !== null ? h.ordem : 0;
      return o > max ? o : max;
    }, 0);
    const nextOrdem = habits.length > 0 ? maxOrdem + 1 : 0;

    const newHabit: Habito = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      nome,
      categoria,
      meta_semanal,
      ordem: nextOrdem,
      usuario_id: usuarioId
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Try inserting with 'ordem' field
        const { data, error } = await supabase
          .from('habitos')
          .insert([{ nome, categoria, meta_semanal, ordem: nextOrdem, usuario_id: usuarioId }])
          .select()
          .single();
        if (error) {
          console.warn('Erro ao inserir com coluna ordem (possivelmente ela nao existe ainda). Fazendo fallback sem ordem:', error);
          // Fallback insert without the 'ordem' field
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('habitos')
            .insert([{ nome, categoria, meta_semanal, usuario_id: usuarioId }])
            .select()
            .single();
          if (fallbackError) throw fallbackError;
          if (fallbackData) return fallbackData;
        }
        if (data) return data;
      } catch (err) {
        console.error('Erro ao salvar hábito no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage write
    const updatedHabits = [...habits, newHabit];
    localStorage.setItem(`${LOCAL_HABITS_KEY}_${usuarioId}`, JSON.stringify(updatedHabits));
    return newHabit;
  },

  async updateHabito(id: string, nome: string, categoria: string, meta_semanal: number, usuarioId: string): Promise<Habito> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('habitos')
          .update({ nome, categoria, meta_semanal })
          .eq('id', id)
          .eq('usuario_id', usuarioId)
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error('Erro ao atualizar hábito no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage write
    const habits = await this.getHabitos(usuarioId);
    const updatedHabits = habits.map(h => h.id === id ? { ...h, nome, categoria, meta_semanal } : h);
    localStorage.setItem(`${LOCAL_HABITS_KEY}_${usuarioId}`, JSON.stringify(updatedHabits));
    return { id, nome, categoria, meta_semanal, usuario_id: usuarioId };
  },

  async updateHabitosOrdem(habitoIds: string[], usuarioId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Run updates for each habit's order index in parallel
        const promises = habitoIds.map((id, index) => {
          return supabase
            .from('habitos')
            .update({ ordem: index })
            .eq('id', id)
            .eq('usuario_id', usuarioId);
        });
        const results = await Promise.all(promises);
        const hasError = results.some(res => res.error);
        if (hasError) {
          console.warn('Algumas atualizações de ordem falharam no Supabase. Talvez a coluna ordem não exista.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Erro ao atualizar ordem de hábitos no Supabase:', err);
        return false;
      }
    }

    // LocalStorage fallback update
    const habitsStr = localStorage.getItem(`${LOCAL_HABITS_KEY}_${usuarioId}`);
    if (habitsStr) {
      const habits: Habito[] = JSON.parse(habitsStr);
      const updatedHabits = habits.map(h => {
        const index = habitoIds.indexOf(h.id);
        return {
          ...h,
          ordem: index !== -1 ? index : 999
        };
      }).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
      localStorage.setItem(`${LOCAL_HABITS_KEY}_${usuarioId}`, JSON.stringify(updatedHabits));
    }
    return true;
  },

  async deleteHabito(id: string, usuarioId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // First delete registers for this habit
        await supabase.from('registros_diarios').delete().eq('habito_id', id).eq('usuario_id', usuarioId);
        
        const { error } = await supabase
          .from('habitos')
          .delete()
          .eq('id', id)
          .eq('usuario_id', usuarioId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Erro ao deletar hábito no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage delete
    const habits = await this.getHabitos(usuarioId);
    const filteredHabits = habits.filter(h => h.id !== id);
    localStorage.setItem(`${LOCAL_HABITS_KEY}_${usuarioId}`, JSON.stringify(filteredHabits));

    // Clean up registers
    const registersStr = localStorage.getItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`);
    if (registersStr) {
      const registers: RegistroDiario[] = JSON.parse(registersStr);
      const filteredRegisters = registers.filter(r => r.habito_id !== id);
      localStorage.setItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`, JSON.stringify(filteredRegisters));
    }

    return true;
  },

  // --- REGISTERS ---
  async getRegistros(startDateStr: string, endDateStr: string, usuarioId: string): Promise<RegistroDiario[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_diarios')
          .select('*')
          .eq('usuario_id', usuarioId)
          .gte('data', startDateStr)
          .lte('data', endDateStr);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar registros no Supabase. Fallback para LocalStorage:', err);
      }
    }

    // LocalStorage read
    const regStr = localStorage.getItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`);
    if (!regStr) {
      const habits = await this.getHabitos(usuarioId);
      const sampleRegs = getSampleRegisters(habits, usuarioId);
      localStorage.setItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`, JSON.stringify(sampleRegs));
      return sampleRegs.filter(r => r.data >= startDateStr && r.data <= endDateStr);
    }
    
    const registers: RegistroDiario[] = JSON.parse(regStr);
    return registers.filter(r => r.data >= startDateStr && r.data <= endDateStr);
  },

  async saveRegistro(registro: Omit<RegistroDiario, 'id'>, usuarioId: string): Promise<RegistroDiario> {
    const recordToSave = {
      ...registro,
      usuario_id: usuarioId
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Check if there is already a record for this habit on this day
        const { data: existing, error: findError } = await supabase
          .from('registros_diarios')
          .select('id')
          .eq('habito_id', registro.habito_id)
          .eq('data', registro.data)
          .eq('usuario_id', usuarioId)
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
            .eq('usuario_id', usuarioId)
            .select()
            .single();
          if (error) throw error;
          return data;
        } else {
          // Insert
          const { data, error } = await supabase
            .from('registros_diarios')
            .insert([recordToSave])
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
    const regStr = localStorage.getItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`);
    const registers: RegistroDiario[] = regStr ? JSON.parse(regStr) : [];
    
    const existingIndex = registers.findIndex(
      r => r.habito_id === registro.habito_id && r.data === registro.data
    );

    const updatedRegistro: RegistroDiario = {
      id: existingIndex >= 0 ? registers[existingIndex].id : `r_${registro.habito_id}_${registro.data}`,
      ...registro,
      usuario_id: usuarioId
    };

    if (existingIndex >= 0) {
      registers[existingIndex] = updatedRegistro;
    } else {
      registers.push(updatedRegistro);
    }

    localStorage.setItem(`${LOCAL_REGISTERS_KEY}_${usuarioId}`, JSON.stringify(registers));
    return updatedRegistro;
  }
};
