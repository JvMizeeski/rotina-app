import React, { useState, useEffect, FormEvent, MouseEvent } from 'react';
import { Plus, Calendar, BookOpen, Clock, Check, ChevronDown, ChevronUp, Trash2, Edit2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, isSupabaseConfigured, formatHorasDedicadas, getLocalDateString } from '../lib/supabase';

interface ChecklistProps {
  user: any;
}

export default function Checklist({ user }: ChecklistProps) {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registros, setRegistros] = useState<Record<string, RegistroDiario>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString()
  );
  
  // Expanded states for habit detail forms
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // New Habit Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCategoria, setNewCategoria] = useState('Saúde');
  const [newMetaSemanal, setNewMetaSemanal] = useState(5);

  // Edit Habit Form State
  const [editingHabit, setEditingHabit] = useState<Habito | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCategoria, setEditCategoria] = useState('Saúde');
  const [editMetaSemanal, setEditMetaSemanal] = useState(5);

  // Loading states to prevent duplicate submission and handle network latency
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState<Record<string, boolean>>({});
  const [savingDetails, setSavingDetails] = useState<Record<string, boolean>>({});
  const [deletingHabits, setDeletingHabits] = useState<Record<string, boolean>>({});

  // Pending Toggle Modal State (for quick completion duration input)
  const [pendingToggleHabitId, setPendingToggleHabitId] = useState<string | null>(null);
  const [toggleMinutes, setToggleMinutes] = useState<number>(30);

  // Notification Banner (Success / Error states)
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Reordering states
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate, user.username]);

  const sortHabitos = (habitsList: Habito[], username: string): Habito[] => {
    // If we have explicit orders from the database, sort by them first
    const hasOrdem = habitsList.some(h => h.ordem !== undefined && h.ordem !== null && h.ordem !== 0);
    if (hasOrdem) {
      return [...habitsList].sort((a, b) => {
        const orderA = a.ordem !== undefined && a.ordem !== null ? a.ordem : 9999;
        const orderB = b.ordem !== undefined && b.ordem !== null ? b.ordem : 9999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.nome.localeCompare(b.nome);
      });
    }

    // Secondary fallback to localStorage order index
    const customOrder: string[] = JSON.parse(localStorage.getItem(`habitracker_habitos_ordem_${username}`) || '[]');
    if (customOrder.length === 0) {
      return habitsList;
    }
    return [...habitsList].sort((a, b) => {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.nome.localeCompare(b.nome);
    });
  };

  const handleMoveHabito = async (habitId: string, direction: 'up' | 'down') => {
    const index = habitos.findIndex(h => h.id === habitId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= habitos.length) return;

    const newHabitos = [...habitos];
    const temp = newHabitos[index];
    newHabitos[index] = newHabitos[newIndex];
    newHabitos[newIndex] = temp;

    // Set layout immediately for snappy feedback
    setHabitos(newHabitos);

    const newOrderIds = newHabitos.map(h => h.id);
    localStorage.setItem(`habitracker_habitos_ordem_${user.username}`, JSON.stringify(newOrderIds));
    
    try {
      await dataService.updateHabitosOrdem(newOrderIds, user.username);
      showBanner('Ordem atualizada no banco!', 'success');
    } catch (err) {
      console.error('Erro ao salvar ordem no banco:', err);
      showBanner('Ordem atualizada localmente.', 'success');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newHabitos = [...habitos];
    const itemToMove = newHabitos[draggedIndex];
    newHabitos.splice(draggedIndex, 1);
    newHabitos.splice(index, 0, itemToMove);

    setDraggedIndex(index);
    setHabitos(newHabitos);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const newOrderIds = habitos.map(h => h.id);
    localStorage.setItem(`habitracker_habitos_ordem_${user.username}`, JSON.stringify(newOrderIds));
    try {
      await dataService.updateHabitosOrdem(newOrderIds, user.username);
    } catch (err) {
      console.error('Erro ao salvar ordem no banco de dados:', err);
    }
  };

  const loadData = async () => {
    try {
      const allHabits = await dataService.getHabitos(user.username);
      const sorted = sortHabitos(allHabits, user.username);
      setHabitos(sorted);

      // Fetch registers for the single selected day
      const dailyRegs = await dataService.getRegistros(selectedDate, selectedDate, user.username);
      
      // Convert to a dictionary for faster lookups: habit_id -> registry
      const regMap: Record<string, RegistroDiario> = {};
      dailyRegs.forEach(reg => {
        regMap[reg.habito_id] = reg;
      });
      setRegistros(regMap);
    } catch (err) {
      console.error(err);
      showBanner('Erro ao carregar dados.', 'error');
    }
  };

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    // Auto-clear notification after 3 seconds
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  };

  const handleToggleConcluido = async (habitId: string) => {
    if (loadingToggles[habitId]) return; // prevent duplicate clicks while pending

    const isCurrentlyDone = registros[habitId]?.concluido || false;

    if (isCurrentlyDone) {
      // Just uncheck immediately without popping modal
      executeToggleConcluido(habitId, 0, false);
    } else {
      // Open the time input modal!
      setPendingToggleHabitId(habitId);
      setToggleMinutes(30); // Default to 30 mins
    }
  };

  const executeToggleConcluido = async (habitId: string, minutes: number, saveTime: boolean) => {
    const isCurrentlyDone = registros[habitId]?.concluido || false;
    const currentReg = registros[habitId] || {
      habito_id: habitId,
      data: selectedDate,
      concluido: false,
      horas_dedicadas: 0,
      comentario: ''
    };

    const updatedReg = {
      ...currentReg,
      concluido: !isCurrentlyDone,
      horas_dedicadas: !isCurrentlyDone && saveTime ? Number((minutes / 60).toFixed(2)) : (isCurrentlyDone ? 0 : currentReg.horas_dedicadas)
    };

    try {
      setLoadingToggles(prev => ({ ...prev, [habitId]: true }));
      const saved = await dataService.saveRegistro(updatedReg, user.username);
      setRegistros(prev => ({
        ...prev,
        [habitId]: saved
      }));
      
      if (!isCurrentlyDone) {
        showBanner('Hábito concluído! Bom trabalho! 🎉', 'success');
      } else {
        showBanner('Hábito desmarcado.', 'success');
      }
    } catch (err) {
      console.error(err);
      showBanner('Erro ao salvar registro.', 'error');
    } finally {
      setLoadingToggles(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const handleSaveDetails = async (habitId: string, horas: number, comment: string) => {
    if (savingDetails[habitId]) return; // prevent duplicate saves

    const currentReg = registros[habitId] || {
      habito_id: habitId,
      data: selectedDate,
      concluido: false,
      horas_dedicadas: 0,
      comentario: ''
    };

    const updatedReg = {
      ...currentReg,
      horas_dedicadas: horas,
      comentario: comment,
      concluido: true // auto-conclude when details are updated/saved
    };

    try {
      setSavingDetails(prev => ({ ...prev, [habitId]: true }));
      const saved = await dataService.saveRegistro(updatedReg, user.username);
      setRegistros(prev => ({
        ...prev,
        [habitId]: saved
      }));
      setExpandedHabitId(null);
      showBanner('Detalhes salvos com sucesso! 💪', 'success');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao salvar detalhes.', 'error');
    } finally {
      setSavingDetails(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const handleAddHabitoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || isAdding) return;

    try {
      setIsAdding(true);
      const added = await dataService.addHabito(newNome, newCategoria, newMetaSemanal, user.username);
      
      // Save new habit ID to custom ordering list in localStorage
      const customOrder: string[] = JSON.parse(localStorage.getItem(`habitracker_habitos_ordem_${user.username}`) || '[]');
      customOrder.push(added.id);
      localStorage.setItem(`habitracker_habitos_ordem_${user.username}`, JSON.stringify(customOrder));

      setHabitos(prev => [...prev, added]);
      setIsAddModalOpen(false);
      setNewNome('');
      setNewCategoria('Saúde');
      setNewMetaSemanal(5);
      showBanner('Novo hábito adicionado! 🚀', 'success');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao adicionar hábito.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditHabitoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editNome.trim() || isEditing) return;

    try {
      setIsEditing(true);
      const updated = await dataService.updateHabito(
        editingHabit.id,
        editNome,
        editCategoria,
        editMetaSemanal,
        user.username
      );
      setHabitos(prev => prev.map(h => h.id === editingHabit.id ? updated : h));
      setEditingHabit(null);
      showBanner('Hábito editado com sucesso! ✏️', 'success');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao editar hábito.', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteHabito = async (habitId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (deletingHabits[habitId]) return;
    
    if (confirm('Deseja realmente excluir este hábito e todo o seu histórico?')) {
      try {
        setDeletingHabits(prev => ({ ...prev, [habitId]: true }));
        await dataService.deleteHabito(habitId, user.username);
        setHabitos(prev => prev.filter(h => h.id !== habitId));
        // remove from local register state
        const updatedRegs = { ...registros };
        delete updatedRegs[habitId];
        setRegistros(updatedRegs);
        showBanner('Hábito removido com sucesso.', 'success');
      } catch (err) {
        console.error(err);
        showBanner('Erro ao remover hábito.', 'error');
      } finally {
        setDeletingHabits(prev => ({ ...prev, [habitId]: false }));
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

  return (
    <div className="pb-24 animate-fade-in" id="page-checklist">
      {/* Top Welcome / Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-purple-400">Olá, {user.display_name}! 👋</span>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans mt-0.5">Minha Rotina</h1>
            <p className="text-xs text-zinc-500 font-mono">
              {isSupabaseConfigured ? '⚡ Sincronizado com Supabase' : '📱 Modo Offline Local (Demonstração)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReordering(!isReordering)}
              className={`flex items-center gap-1.5 px-3.5 py-3 rounded-2xl font-bold transition-all text-xs cursor-pointer active:scale-95 border ${
                isReordering
                  ? 'bg-emerald-600 border-transparent text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {isReordering ? (
                <>
                  <Check size={15} />
                  <span>Pronto</span>
                </>
              ) : (
                <>
                  <GripVertical size={15} />
                  <span>Reordenar</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4.5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-transform active:scale-95 text-xs cursor-pointer shadow-lg shadow-purple-600/20 shrink-0"
              id="btn-add-habit"
            >
              <Plus size={16} />
              <span>Novo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restored Date Selector Row with plenty of margin bottom */}
      <div className="flex items-center justify-between gap-2 mb-6">
        {/* Left: Informative Date Info Banner */}
        <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex-1 min-w-0">
          <Calendar className="text-purple-400 shrink-0" size={18} />
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">DATA DE REGISTRO</span>
            <span className="text-xs font-bold text-white truncate uppercase">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Right: Highly Clickable Date Picker Selector Component */}
        <div className="relative flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/40 transition-all cursor-pointer select-none shrink-0">
          {/* Calendar icon in white for perfect visibility */}
          <Calendar className="text-white shrink-0 text-purple-400" size={16} />
          <span className="text-xs font-semibold text-zinc-200 font-mono">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}
          </span>
          {/* Hidden/Transparent real input covering the wrapper to be naturally clicked */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id="input-date-picker"
          />
        </div>
      </div>

      {/* Habits Checklist Area */}
      {habitos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-8">
          <BookOpen className="text-zinc-600 mb-3" size={36} />
          <p className="text-sm text-zinc-300 font-semibold">Nenhum hábito cadastrado ainda.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Toque no botão "Novo" no canto superior direito para criar o seu primeiro hábito e começar a monitorar sua consistência!
          </p>
        </div>
      ) : isReordering ? (
        /* Drag-to-Reorder Mode UI */
        <div className="flex flex-col gap-3">
          {/* Reorder Mode Info Callout */}
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between gap-3 mb-2 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <GripVertical className="text-purple-400 animate-pulse shrink-0" size={18} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Modo de Reordenação Ativo</span>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Segure e arraste os hábitos ou toque nas setas para ajustar.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsReordering(false)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              Concluído
            </button>
          </div>

          {/* List of Draggable Items */}
          <div className="flex flex-col gap-2.5">
            {habitos.map((habit, index) => (
              <div
                key={habit.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all select-none ${
                  draggedIndex === index
                    ? 'bg-purple-950/40 border-purple-500/80 scale-[1.01] shadow-lg shadow-purple-500/10 opacity-80'
                    : 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700/60 cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Drag Handle Icon */}
                  <div className="text-zinc-500 group-hover:text-zinc-300 p-1 shrink-0">
                    <GripVertical size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-zinc-200 block truncate">
                      {habit.nome}
                    </span>
                    <span className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 font-bold ${getCategoryBadgeColor(habit.categoria)}`}>
                      {habit.categoria}
                    </span>
                  </div>
                </div>

                {/* Touch fallback arrow buttons (strictly inside the Reorder mode) */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleMoveHabito(habit.id, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveHabito(habit.id, 'down')}
                    disabled={index === habitos.length - 1}
                    className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Regular checklist - completely arrowless and uncluttered! */
        <div className="flex flex-col gap-4">
          {habitos.map((habit) => {
            const isCompleted = registros[habit.id]?.concluido || false;
            const isExpanded = expandedHabitId === habit.id;
            const itemReg = registros[habit.id] || {
              horas_dedicadas: 0,
              comentario: ''
            };

            return (
              <div
                key={habit.id}
                className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-br from-zinc-900 to-purple-950/20 border-purple-500/30 shadow-md shadow-purple-950/10'
                    : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/80'
                }`}
                id={`habit-card-${habit.id}`}
              >
                {/* Master click area */}
                <div 
                  className={`flex items-center justify-between p-4 gap-3 cursor-pointer select-none active:bg-zinc-800/20 transition-opacity ${
                    loadingToggles[habit.id] ? 'opacity-60 pointer-events-none' : ''
                  }`}
                  onClick={() => handleToggleConcluido(habit.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Visual Checkbox */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                        isCompleted
                          ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-500 border-transparent text-white shadow-md shadow-purple-500/20 scale-105'
                          : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                      }`}
                    >
                      {loadingToggles[habit.id] ? (
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check size={16} strokeWidth={3.5} className={isCompleted ? 'block' : 'opacity-0'} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-bold leading-snug truncate transition-colors ${
                          isCompleted ? 'text-purple-300 font-extrabold' : 'text-zinc-200'
                        }`}
                      >
                        {habit.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${getCategoryBadgeColor(habit.categoria)}`}>
                          {habit.categoria}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-bold font-mono">
                          Meta: {habit.meta_semanal}x/sem
                        </span>
                        {itemReg.horas_dedicadas > 0 && (
                           <span className="text-[9px] font-bold font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded-full border border-purple-500/10 flex items-center gap-1">
                             <Clock size={10} /> {formatHorasDedicadas(itemReg.horas_dedicadas)}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side expand / edit / trash tools */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Expand Detail toggle */}
                    <button
                      onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                      disabled={loadingToggles[habit.id] || deletingHabits[habit.id]}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Detalhar registro"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Edit habit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHabit(habit);
                        setEditNome(habit.nome);
                        setEditCategoria(habit.categoria);
                        setEditMetaSemanal(habit.meta_semanal);
                      }}
                      disabled={loadingToggles[habit.id] || deletingHabits[habit.id]}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-purple-400 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Editar hábito"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete habit */}
                    <button
                      onClick={(e) => handleDeleteHabito(habit.id, e)}
                      disabled={loadingToggles[habit.id] || deletingHabits[habit.id]}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Excluir hábito"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Drawer to log detail fields */}
                {isExpanded && (
                  <HabitFormFields
                    initialHoras={itemReg.horas_dedicadas}
                    initialComment={itemReg.comentario}
                    onSave={(horas, comment) => handleSaveDetails(habit.id, horas, comment)}
                    onClose={() => setExpandedHabitId(null)}
                    isSaving={!!savingDetails[habit.id]}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 border px-5 py-3 rounded-full text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 animate-bounce ${
          notification.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/30 text-rose-300'
            : 'bg-slate-900 border border-purple-500/30 text-purple-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-ping ${
            notification.type === 'error' ? 'bg-rose-400' : 'bg-purple-400'
          }`}></div>
          {notification.text}
        </div>
      )}

      {/* Add Habit Overlay Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Adicionar Novo Hábito</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isAdding}
                className="text-zinc-500 hover:text-white font-bold p-1 cursor-pointer disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHabitoSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome do Hábito</label>
                <input
                  type="text"
                  required
                  disabled={isAdding}
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Ler livro, Fazer Cardio, Meditar..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-sans text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  id="habit-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Categoria</label>
                  <select
                    value={newCategoria}
                    disabled={isAdding}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Saúde">💪 Saúde</option>
                    <option value="Estudos">📚 Estudos</option>
                    <option value="Mente">🧘 Mente</option>
                    <option value="Trabalho">💼 Trabalho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Meta Semanal</label>
                  <select
                    value={newMetaSemanal}
                    disabled={isAdding}
                    onChange={(e) => setNewMetaSemanal(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold font-mono cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(v => (
                      <option key={v} value={v}>{v}x na semana</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono mt-2 cursor-pointer shadow-lg shadow-purple-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
                id="habit-submit-button"
              >
                {isAdding ? 'Criando hábito...' : 'Criar Hábito'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Habit Overlay Modal */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Editar Hábito</h2>
              <button
                onClick={() => setEditingHabit(null)}
                disabled={isEditing}
                className="text-zinc-500 hover:text-white font-bold p-1 cursor-pointer disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditHabitoSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome do Hábito</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do hábito..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-sans text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Categoria</label>
                  <select
                    value={editCategoria}
                    disabled={isEditing}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Saúde">💪 Saúde</option>
                    <option value="Estudos">📚 Estudos</option>
                    <option value="Mente">🧘 Mente</option>
                    <option value="Trabalho">💼 Trabalho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Meta Semanal</label>
                  <select
                    value={editMetaSemanal}
                    disabled={isEditing}
                    onChange={(e) => setEditMetaSemanal(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold font-mono cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(v => (
                      <option key={v} value={v}>{v}x na semana</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  disabled={isEditing}
                  className="flex-1 py-3.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider font-mono cursor-pointer text-center disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer shadow-lg shadow-purple-600/15 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Completion Time Confirmation Modal */}
      {pendingToggleHabitId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800/80 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Clock className="text-purple-400" size={16} /> Tempo de Atividade
              </h2>
              <button
                onClick={() => setPendingToggleHabitId(null)}
                className="text-zinc-500 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Qual foi o tempo médio que você dedicou a essa atividade para cumpri-la hoje?
              </p>

              {/* Time Control Buttons and Input */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setToggleMinutes(Math.max(0, toggleMinutes - 10))}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                  >
                    -10m
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggleMinutes(Math.max(0, toggleMinutes - 5))}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                  >
                    -5
                  </button>

                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl flex-1 justify-center">
                    <input
                      type="number"
                      value={toggleMinutes || ''}
                      onChange={(e) => setToggleMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 bg-transparent text-white font-mono text-center text-xs focus:outline-none font-bold"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-zinc-500 font-bold font-mono">min</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setToggleMinutes(toggleMinutes + 5)}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggleMinutes(toggleMinutes + 15)}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                  >
                    +15m
                  </button>
                </div>

                {/* Display friendly conversion */}
                <div className="text-right text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wide">
                  Dedicação: <span className="text-purple-400">{formatHorasDedicadas(toggleMinutes / 60)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    executeToggleConcluido(pendingToggleHabitId, toggleMinutes, true);
                    setPendingToggleHabitId(null);
                  }}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer shadow-lg shadow-purple-600/15 text-center"
                >
                  Salvar Tempo e Concluir
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    executeToggleConcluido(pendingToggleHabitId, 0, false);
                    setPendingToggleHabitId(null);
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer text-center"
                >
                  Concluir sem registrar tempo
                </button>

                <button
                  type="button"
                  onClick={() => setPendingToggleHabitId(null)}
                  className="w-full py-2 text-zinc-500 hover:text-zinc-400 text-xs font-semibold font-mono cursor-pointer text-center mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface HabitFormFieldsProps {
  initialHoras: number;
  initialComment: string;
  onSave: (horas: number, comment: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

function HabitFormFields({
  initialHoras,
  initialComment,
  onSave,
  onClose,
  isSaving
}: HabitFormFieldsProps) {
  // Convert hours to minutes for granular entry
  const [minutos, setMinutos] = useState(Math.round((initialHoras || 0) * 60));
  const [comment, setComment] = useState(initialComment || '');

  const handleSave = () => {
    // Save as hours (minutos / 60)
    onSave(minutos / 60, comment);
  };

  return (
    <div className="p-4.5 bg-zinc-950 border-t border-zinc-850 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {/* Hours Log picker with support for minutes */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-zinc-400 font-bold flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Clock size={14} className="text-purple-400" /> Tempo Dedicado
          </span>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setMinutos(Math.max(0, minutos - 10))}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors disabled:opacity-40"
            >
              -10m
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setMinutos(Math.max(0, minutos - 5))}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors disabled:opacity-40"
            >
              -5
            </button>
            
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl">
              <input
                type="number"
                disabled={isSaving}
                value={minutos || ''}
                onChange={(e) => setMinutos(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-10 bg-transparent text-white font-mono text-center text-xs focus:outline-none font-bold disabled:opacity-50"
                placeholder="0"
              />
              <span className="text-[10px] text-zinc-500 font-bold font-mono">min</span>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => setMinutos(minutos + 5)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors disabled:opacity-40"
            >
              +5
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setMinutos(minutos + 15)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors disabled:opacity-40"
            >
              +15m
            </button>
          </div>
        </div>

        {/* Display converted friendly time */}
        <div className="text-right text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wide">
          Convertido: <span className="text-purple-400">{formatHorasDedicadas(minutos / 60)}</span>
        </div>

        {/* Comment Note input */}
        <div>
          <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nota ou Comentário</label>
          <input
            type="text"
            disabled={isSaving}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Como foi seu desempenho hoje?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-purple-500 font-medium disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all text-xs cursor-pointer text-center uppercase font-mono tracking-wider disabled:opacity-55 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Salvando...' : 'Salvar Detalhes'}
        </button>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-all text-xs border border-zinc-850 cursor-pointer uppercase font-mono disabled:opacity-55 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
