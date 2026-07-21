import { useState, useEffect, useRef } from 'react';
import { Calendar, Award, Star, Clock, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, formatHorasDedicadas, getLocalDateString } from '../lib/supabase';

const CATEGORIES = ['Todos', 'Saúde', 'Estudos', 'Mente', 'Trabalho'];

const getCalendarIcon = (className: string = "w-4 h-4") => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_calendar_custom)">
        <path d="M5.33333 1.33301V3.99989M10.6667 1.33301V3.99989M2 6.66677H14M3.33333 2.66645H12.6667C13.403 2.66645 14 3.26345 14 3.99989V13.334C14 14.0704 13.403 14.6674 12.6667 14.6674H3.33333C2.59695 14.6674 2 14.0704 2 13.334V3.99989C2 3.26345 2.59695 2.66645 3.33333 2.66645Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <defs>
        <clipPath id="clip0_calendar_custom">
          <rect width="16" height="16" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};

const getCategoryIcon = (cat: string, className: string = "w-3.5 h-3.5") => {
  switch (cat) {
    case 'Todos':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <g clipPath="url(#clip0_todos)">
            <path d="M1.16797 6.99967C1.16769 7.11125 1.19942 7.22057 1.2594 7.31466C1.31937 7.40876 1.40507 7.48367 1.50633 7.53054L6.52335 9.8115C6.67456 9.87997 6.83864 9.91539 7.00463 9.91539C7.17062 9.91539 7.3347 9.87997 7.48591 9.8115L12.4913 7.53637C12.5945 7.48996 12.6821 7.4145 12.7432 7.3192C12.8043 7.22391 12.8363 7.11288 12.8355 6.99967M1.16797 9.9165C1.16769 10.0281 1.19942 10.1374 1.2594 10.2315C1.31937 10.3256 1.40507 10.4005 1.50633 10.4474L6.52335 12.7283C6.67456 12.7968 6.83864 12.8322 7.00463 12.8322C7.17062 12.8322 7.3347 12.7968 7.48591 12.7283L12.4913 10.4532C12.5945 10.4068 12.6821 10.3313 12.7432 10.236C12.8043 10.1407 12.8363 10.0297 12.8355 9.9165M7.48618 1.27123C7.33417 1.2019 7.16905 1.16602 7.00197 1.16602C6.8349 1.16602 6.66978 1.2019 6.51777 1.27123L1.51826 3.54636C1.41474 3.592 1.32672 3.66676 1.26493 3.76154C1.20315 3.85631 1.17025 3.967 1.17025 4.08014C1.17025 4.19327 1.20315 4.30397 1.26493 4.39874C1.32672 4.49351 1.41474 4.56827 1.51826 4.61392L6.52361 6.89488C6.67561 6.96421 6.84074 7.00009 7.00781 7.00009C7.17488 7.00009 7.34 6.96421 7.49201 6.89488L12.4974 4.61975C12.6009 4.57411 12.6889 4.49934 12.7507 4.40457C12.8125 4.3098 12.8454 4.19911 12.8454 4.08597C12.8454 3.97284 12.8125 3.86214 12.7507 3.76737C12.6889 3.6726 12.6009 3.59784 12.4974 3.55219L7.48618 1.27123Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </g>
          <defs>
            <clipPath id="clip0_todos">
              <rect width="14" height="14" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      );
    case 'Saúde':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <g clipPath="url(#clip0_saude)">
            <path d="M12.8356 6.99982H11.3888C11.1338 6.99927 10.8857 7.08225 10.6824 7.23607C10.4791 7.38988 10.3317 7.60606 10.2629 7.85155L8.89192 12.7286C8.88308 12.7589 8.86466 12.7855 8.83942 12.8044C8.81417 12.8234 8.78347 12.8336 8.75191 12.8336C8.72035 12.8336 8.68965 12.8234 8.6644 12.8044C8.63916 12.7855 8.62073 12.7589 8.6119 12.7286L5.39164 1.27102C5.3828 1.24073 5.36438 1.21412 5.33914 1.19518C5.31389 1.17625 5.28319 1.16602 5.25163 1.16602C5.22007 1.16602 5.18937 1.17625 5.16412 1.19518C5.13888 1.21412 5.12045 1.24073 5.11162 1.27102L3.74067 6.14808C3.67211 6.39261 3.52563 6.60809 3.32348 6.7618C3.12133 6.91552 2.87454 6.99909 2.62058 6.99982H1.16797" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </g>
          <defs>
            <clipPath id="clip0_saude">
              <rect width="14" height="14" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      );
    case 'Estudos':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M7.00177 4.08333V12.25M7.00177 4.08333C7.00177 3.46449 6.75592 2.871 6.3183 2.43342C5.88068 1.99583 5.28714 1.75 4.66825 1.75H1.75135C1.59663 1.75 1.44824 1.81146 1.33884 1.92085C1.22943 2.03025 1.16797 2.17862 1.16797 2.33333V9.91667C1.16797 10.0714 1.22943 10.2197 1.33884 10.3291C1.44824 10.4385 1.59663 10.5 1.75135 10.5H5.25163C5.7158 10.5 6.16095 10.6844 6.48917 11.0126C6.81738 11.3408 7.00177 11.7859 7.00177 12.25M7.00177 4.08333C7.00177 3.46449 7.24762 2.871 7.68524 2.43342C8.12286 1.99583 8.7164 1.75 9.33529 1.75H12.2522C12.4069 1.75 12.5553 1.81146 12.6647 1.92085C12.7741 2.03025 12.8356 2.17862 12.8356 2.33333V9.91667C12.8356 10.0714 12.7741 10.2197 12.6647 10.3291C12.5553 10.4385 12.4069 10.5 12.2522 10.5H8.75191C8.28774 10.5 7.84259 10.6844 7.51437 11.0126C7.18616 11.3408 7.00177 11.7859 7.00177 12.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'Mente':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M1.73276 3.72413C1.36491 4.259 1.16798 4.89287 1.16797 5.54201C1.16797 6.88369 2.04304 7.87536 2.9181 8.75037L6.13135 11.8607C6.24163 11.9842 6.37691 12.0828 6.52821 12.1499C6.67952 12.2171 6.84338 12.2512 7.00892 12.2502C7.17446 12.2491 7.33787 12.2129 7.48832 12.1438C7.63876 12.0748 7.77278 11.9745 7.88149 11.8496L11.0854 8.75037C11.9605 7.87536 12.8355 6.87785 12.8355 5.54201C12.8386 4.89144 12.6435 4.25536 12.2761 3.71843C11.9088 3.1815 11.3866 2.76917 10.7791 2.53634C10.1715 2.30351 9.5075 2.26121 8.87535 2.41508C8.24319 2.56894 7.67289 2.91167 7.24035 3.39765C7.20979 3.43033 7.17284 3.45638 7.1318 3.47419C7.09076 3.492 7.04649 3.50119 7.00175 3.50119C6.95701 3.50119 6.91274 3.492 6.8717 3.47419C6.83066 3.45638 6.79371 3.43033 6.76315 3.39765C6.32925 2.91481 5.75908 2.57494 5.12795 2.42292C4.49682 2.2709 3.83442 2.31389 3.22823 2.54621C2.62205 2.77853 2.1006 3.18925 1.73276 3.72413Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'Trabalho':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M9.33529 11.666V2.33268C9.33529 2.02326 9.21236 1.72652 8.99355 1.50772C8.77474 1.28893 8.47797 1.16602 8.16853 1.16602H5.83501C5.52557 1.16602 5.2288 1.28893 5.00999 1.50772C4.79118 1.72652 4.66825 2.02326 4.66825 2.33268V11.666M2.33473 3.49935H11.6688C12.3132 3.49935 12.8356 4.02168 12.8356 4.66602V10.4993C12.8356 11.1437 12.3132 11.666 11.6688 11.666H2.33473C1.69035 11.666 1.16797 11.1437 1.16797 10.4993V4.66602C1.16797 4.02168 1.69035 3.49935 2.33473 3.49935Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
};

const getCategoryColorClass = (cat: string) => {
  switch (cat) {
    case 'Saúde': return 'text-emerald-400';
    case 'Estudos': return 'text-blue-400';
    case 'Mente': return 'text-purple-400';
    case 'Trabalho': return 'text-amber-400';
    default: return 'text-zinc-400';
  }
};

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
          {getCalendarIcon("text-purple-400 w-[13px] h-[13px] shrink-0")}
          Período: {weekRange.start ? new Date(weekRange.start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} - {weekRange.end ? new Date(weekRange.end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
        </p>
      </div>

      {/* Period Selector Card */}
      <div className="p-4.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 mb-6 flex flex-col gap-4">
        {/* Preset buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleApplyPreset('week')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
              activePreset === 'week'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {getCalendarIcon("w-3.5 h-3.5 shrink-0")}
            <span>Esta Semana</span>
          </button>
          <button
            onClick={() => handleApplyPreset('month')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
              activePreset === 'month'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {getCalendarIcon("w-3.5 h-3.5 shrink-0")}
            <span>Este Mês</span>
          </button>
          <button
            onClick={() => handleApplyPreset('last30')}
            className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
              activePreset === 'last30'
                ? 'bg-purple-600 border-transparent text-white shadow-lg shadow-purple-600/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {getCalendarIcon("w-3.5 h-3.5 shrink-0")}
            <span>30 Dias</span>
          </button>
        </div>

        {/* Custom date range inputs */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/40">
          <div className="relative">
            <label className="block text-[9px] font-bold text-zinc-500 font-mono uppercase mb-1 tracking-wider">Início</label>
            <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-xl hover:border-zinc-700 transition-colors p-2.5 cursor-pointer">
              {getCalendarIcon("text-zinc-400 mr-2 shrink-0 w-[13px] h-[13px]")}
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
              {getCalendarIcon("text-zinc-400 mr-2 shrink-0 w-[13px] h-[13px]")}
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
              <span className="flex items-center gap-1.5">
                {getCategoryIcon(cat, "w-3.5 h-3.5 shrink-0")}
                <span>{cat}</span>
              </span>
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
                  <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-mono border-b border-zinc-850 pb-1.5 ${getCategoryColorClass(cat)}`}>
                    {getCategoryIcon(cat, "w-4 h-4 shrink-0")}
                    <span>{cat}</span>
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
