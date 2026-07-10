import { useState, useEffect } from 'react';
import { Calendar, Award, Star, Clock, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, formatHorasDedicadas, getLocalDateString } from '../lib/supabase';

const CATEGORIES = ['Todos', 'Saúde', 'Estudos', 'Mente', 'Trabalho'];

export default function Dashboard({ user }: { user: any }) {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activePreset, setActivePreset] = useState<'week' | 'month' | 'last30' | 'custom'>('week');

  useEffect(() => {
    // Calculate current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // Sunday is 0, Monday is 1...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // calculate Monday of this week
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = getLocalDateString(monday);
    const endStr = getLocalDateString(sunday);

    setWeekRange({ start: startStr, end: endStr });
    loadData(startStr, endStr);
  }, []);

  const loadData = async (start: string, end: string) => {
    try {
      setLoading(true);
      const allHabits = await dataService.getHabitos(user.username);
      const allRegs = await dataService.getRegistros(start, end, user.username);
      
      setHabitos(allHabits);
      setRegistros(allRegs);
    } catch (err) {
      console.error('Erro ao buscar dados no Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: 'week' | 'month' | 'last30') => {
    setActivePreset(preset);
    const today = new Date();
    let startStr = '';
    let endStr = '';

    if (preset === 'week') {
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      startStr = getLocalDateString(monday);
      endStr = getLocalDateString(sunday);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startStr = getLocalDateString(firstDay);
      endStr = getLocalDateString(lastDay);
    } else if (preset === 'last30') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      
      startStr = getLocalDateString(start);
      endStr = getLocalDateString(today);
    }

    setWeekRange({ start: startStr, end: endStr });
    loadData(startStr, endStr);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    if (!value) return;
    setActivePreset('custom');
    
    setWeekRange(prev => {
      const updated = { ...prev, [type]: value };
      if (type === 'start' && updated.end && value > updated.end) {
        updated.end = value;
      } else if (type === 'end' && updated.start && value < updated.start) {
        updated.start = value;
      }
      
      loadData(updated.start, updated.end);
      return updated;
    });
  };

  const getDaysInRange = () => {
    if (!weekRange.start || !weekRange.end) return 7;
    const s = new Date(weekRange.start + 'T12:00:00');
    const e = new Date(weekRange.end + 'T12:00:00');
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Filter habits according to selected category
  const filteredHabits = selectedCategory === 'Todos'
    ? habitos
    : habitos.filter(h => h.categoria === selectedCategory);

  // Helper to count completions for a habit this week
  const getCompletedCount = (habitId: string) => {
    return registros.filter(r => r.habito_id === habitId && r.concluido).length;
  };

  // Helper to compute total hours logged this week for filtered habits
  const getTotalHours = () => {
    const filteredHabitIds = filteredHabits.map(h => h.id);
    return registros
      .filter(r => filteredHabitIds.includes(r.habito_id))
      .reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);
  };

  // Helper for overall checklist completion rate for filtered habits
  const getOverallCompletionRate = () => {
    if (filteredHabits.length === 0) return 0;
    const days = getDaysInRange();
    const factor = days / 7;

    const totalPossibleConcl = filteredHabits.reduce((acc, h) => {
      const targetForRange = Math.max(1, Math.round(h.meta_semanal * factor));
      return acc + targetForRange;
    }, 0);

    if (totalPossibleConcl === 0) return 0;

    const totalDone = filteredHabits.reduce((acc, h) => {
      const targetForRange = Math.max(1, Math.round(h.meta_semanal * factor));
      return acc + Math.min(getCompletedCount(h.id), targetForRange);
    }, 0);

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

  // Helper to render a habit item
  const renderHabitProgressItem = (habit: Habito) => {
    const doneCount = getCompletedCount(habit.id);
    const days = getDaysInRange();
    const factor = days / 7;
    const target = Math.max(1, Math.round(habit.meta_semanal * factor));
    const percent = Math.min(100, Math.round((doneCount / target) * 100));
    const isGoalMet = doneCount >= target;

    return (
      <div key={habit.id} className="group" id={`dashboard-habit-${habit.id}`}>
        {/* Label / Values Row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="min-w-0 pr-2">
            <span className="text-sm font-semibold text-zinc-200 block truncate group-hover:text-white transition-colors">
              {habit.nome}
            </span>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border mt-0.5 font-mono ${getCategoryTagStyle(habit.categoria)}`}>
              {habit.categoria}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-extrabold font-mono ${isGoalMet ? 'text-purple-400' : 'text-zinc-400'}`}>
              {doneCount} de {target} dias
            </span>
            <span className="text-[9px] block text-zinc-500 font-mono">
              {isGoalMet ? '🏆 Cumprida!' : `${percent}% completo`}
            </span>
          </div>
        </div>

        {/* Custom Track and Progress bar */}
        <div className="w-full h-3 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden relative p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out-back ${
              isGoalMet
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-400 shadow-sm shadow-purple-500/25'
                : 'bg-gradient-to-r from-purple-800 to-purple-600'
            }`}
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 animate-fade-in" id="page-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-white font-sans">Estatísticas & Progresso</h1>
        <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1.5 font-mono uppercase">
          <Calendar size={13} className="text-purple-400" />
          Período: {weekRange.start ? new Date(weekRange.start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} - {weekRange.end ? new Date(weekRange.end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
        </p>
      </div>

      {/* Period Selector Card */}
      <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 mb-6 flex flex-col gap-4">
        {/* Preset buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleApplyPreset('week')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border text-center ${
              activePreset === 'week'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            🗓️ Esta Semana
          </button>
          <button
            onClick={() => handleApplyPreset('month')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border text-center ${
              activePreset === 'month'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            📅 Este Mês
          </button>
          <button
            onClick={() => handleApplyPreset('last30')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border text-center ${
              activePreset === 'last30'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            🚀 30 Dias
          </button>
        </div>

        {/* Custom date range inputs */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/40">
          <div className="relative">
            <label className="block text-[9px] font-bold text-zinc-500 font-mono uppercase mb-1 tracking-wider">Início</label>
            <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-xl hover:border-zinc-700 transition-colors p-2.5 cursor-pointer">
              <Calendar size={13} className="text-zinc-400 mr-2 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200 font-mono">
                {weekRange.start ? new Date(weekRange.start + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
              </span>
              <input
                type="date"
                value={weekRange.start}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[9px] font-bold text-zinc-500 font-mono uppercase mb-1 tracking-wider">Fim</label>
            <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-xl hover:border-zinc-700 transition-colors p-2.5 cursor-pointer">
              <Calendar size={13} className="text-zinc-400 mr-2 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200 font-mono">
                {weekRange.end ? new Date(weekRange.end + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
              </span>
              <input
                type="date"
                value={weekRange.end}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Badges */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-purple-600 text-white border-transparent shadow-lg shadow-purple-600/10'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800/80 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {cat === 'Todos' ? '🌐 Todos' : cat === 'Saúde' ? '💪 Saúde' : cat === 'Estudos' ? '📚 Estudos' : cat === 'Mente' ? '🧘 Mente' : '💼 Trabalho'}
            </button>
          );
        })}
      </div>

      {/* Overview Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between shadow-lg">
          <span className="text-[10px] text-zinc-400 uppercase font-bold font-mono tracking-wider">Consistência</span>
          <div className="my-3 text-2xl font-extrabold text-purple-400 flex items-center justify-center gap-1.5">
            <Award size={22} />
            <span>{getOverallCompletionRate()}%</span>
          </div>
          <span className="text-[9px] text-zinc-500 leading-tight">No período selecionado</span>
        </div>

        <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between shadow-lg">
          <span className="text-[10px] text-zinc-400 uppercase font-bold font-mono tracking-wider">Dedicação</span>
          <div className="my-3 text-2xl font-extrabold text-fuchsia-400 flex items-center justify-center gap-1.5">
            <Clock size={22} />
            <span>{formatHorasDedicadas(getTotalHours())}</span>
          </div>
          <span className="text-[9px] text-zinc-500 leading-tight">Focadas no período</span>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
          <Sparkles size={14} className="text-purple-400" /> Metas Semanais por Hábito
        </h2>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs font-mono">Carregando métricas...</div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">Sem hábitos nesta categoria para monitorar.</div>
        ) : selectedCategory === 'Todos' ? (
          /* Show grouped by category */
          <div className="flex flex-col gap-6">
            {['Saúde', 'Estudos', 'Mente', 'Trabalho'].map(cat => {
              const groupHabits = filteredHabits.filter(h => h.categoria === cat);
              if (groupHabits.length === 0) return null;

              return (
                <div key={cat} className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 font-mono border-b border-zinc-850 pb-1.5">
                    {cat === 'Saúde' ? '💪 Saúde' : cat === 'Estudos' ? '📚 Estudos' : cat === 'Mente' ? '🧘 Mente' : '💼 Trabalho'}
                  </h3>
                  <div className="flex flex-col gap-5">
                    {groupHabits.map(habit => renderHabitProgressItem(habit))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Show filtered list directly */
          <div className="flex flex-col gap-5">
            {filteredHabits.map(habit => renderHabitProgressItem(habit))}
          </div>
        )}
      </div>

      {/* Motivational message */}
      <div className="mt-5 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
        <Star className="text-purple-400 shrink-0" size={18} />
        <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
          Cada pequeno passo conta! Hábitos concluídos ajudam a reprogramar sua rotina diária para o sucesso. Mantenha as barras <span className="text-purple-400 font-bold">roxas</span>!
        </p>
      </div>
    </div>
  );
}
