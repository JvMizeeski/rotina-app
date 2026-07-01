import { useState, useEffect } from 'react';
import { Calendar, Award, Star, Clock, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, formatHorasDedicadas } from '../lib/supabase';

export default function Dashboard({ user }: { user: any }) {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // Sunday is 0, Monday is 1...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // calculate Monday of this week
    
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

  // Helper to count completions for a habit this week
  const getCompletedCount = (habitId: string) => {
    return registros.filter(r => r.habito_id === habitId && r.concluido).length;
  };

  // Helper to compute total hours logged this week
  const getTotalHours = () => {
    return registros.reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);
  };

  // Helper for overall checklist completion rate
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

  return (
    <div className="pb-24 animate-fade-in" id="page-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Progresso Semanal</h1>
        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-mono uppercase">
          <Calendar size={12} className="text-purple-400" />
          Período: {weekRange.start ? new Date(weekRange.start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''} - {weekRange.end ? new Date(weekRange.end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''}
        </p>
      </div>

      {/* Overview Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between shadow-lg">
          <span className="text-[10px] text-zinc-400 uppercase font-bold font-mono tracking-wider">Consistência</span>
          <div className="my-3 text-2xl font-extrabold text-purple-400 flex items-center justify-center gap-1.5">
            <Award size={22} />
            <span>{getOverallCompletionRate()}%</span>
          </div>
          <span className="text-[9px] text-zinc-500 leading-tight">Da meta total semanal</span>
        </div>

        <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center flex flex-col justify-between shadow-lg">
          <span className="text-[10px] text-zinc-400 uppercase font-bold font-mono tracking-wider">Dedicação</span>
          <div className="my-3 text-2xl font-extrabold text-fuchsia-400 flex items-center justify-center gap-1.5">
            <Clock size={22} />
            <span>{formatHorasDedicadas(getTotalHours())}</span>
          </div>
          <span className="text-[9px] text-zinc-500 leading-tight">Focadas esta semana</span>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
          <Sparkles size={14} className="text-purple-400" /> Metas Semanais por Hábito
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
            })}
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
