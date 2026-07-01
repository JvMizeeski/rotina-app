import { useState, useEffect, FormEvent, MouseEvent } from 'react';
import { Plus, Calendar, BookOpen, Clock, Check, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, isSupabaseConfigured, formatHorasDedicadas } from '../lib/supabase';

interface ChecklistProps {
  user: any;
}

export default function Checklist({ user }: ChecklistProps) {
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

  // Edit Habit Form State
  const [editingHabit, setEditingHabit] = useState<Habito | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCategoria, setEditCategoria] = useState('Saúde');
  const [editMetaSemanal, setEditMetaSemanal] = useState(5);

  // Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate, user.username]);

  const loadData = async () => {
    try {
      const allHabits = await dataService.getHabitos(user.username);
      setHabitos(allHabits);

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
      comentario: ''
    };

    const updatedReg = {
      ...currentReg,
      concluido: !isCurrentlyDone
    };

    try {
      const saved = await dataService.saveRegistro(updatedReg, user.username);
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

  const handleSaveDetails = async (habitId: string, horas: number, comment: string) => {
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
      const saved = await dataService.saveRegistro(updatedReg, user.username);
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
      const added = await dataService.addHabito(newNome, newCategoria, newMetaSemanal, user.username);
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

  const handleEditHabitoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editNome.trim()) return;

    try {
      const updated = await dataService.updateHabito(
        editingHabit.id,
        editNome,
        editCategoria,
        editMetaSemanal,
        user.username
      );
      setHabitos(prev => prev.map(h => h.id === editingHabit.id ? updated : h));
      setEditingHabit(null);
      showBanner('Hábito editado com sucesso! ✏️');
    } catch (err) {
      console.error(err);
      showBanner('Erro ao editar hábito.');
    }
  };

  const handleDeleteHabito = async (habitId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este hábito e todo o seu histórico?')) {
      try {
        await dataService.deleteHabito(habitId, user.username);
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

  return (
    <div className="pb-24 animate-fade-in" id="page-checklist">
      {/* Top Welcome / Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-purple-400">Olá, {user.display_name}! 👋</span>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans mt-0.5">Minha Rotina</h1>
          <p className="text-xs text-zinc-500 font-mono">
            {isSupabaseConfigured ? '⚡ Sincronizado com Supabase' : '📱 Modo Offline Local (Demonstração)'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Date Selector Banner */}
          <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex-1">
            <Calendar className="text-purple-400 shrink-0" size={18} />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">DATA DE REGISTRO</span>
              <span className="text-xs font-bold text-white truncate uppercase">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short',
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
            className="px-3.5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
            id="input-date-picker"
          />

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

      {/* Habits Checklist Area */}
      {habitos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-8">
          <BookOpen className="text-zinc-600 mb-3" size={36} />
          <p className="text-sm text-zinc-300 font-semibold">Nenhum hábito cadastrado ainda.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Toque no botão "Novo" no canto superior direito para criar o seu primeiro hábito e começar a monitorar sua consistência!
          </p>
        </div>
      ) : (
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
                  className="flex items-center justify-between p-4 gap-3 cursor-pointer select-none active:bg-zinc-800/20"
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
                      <Check size={16} strokeWidth={3.5} className={isCompleted ? 'block' : 'opacity-0'} />
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
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
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
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-purple-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                      title="Editar hábito"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete habit */}
                    <button
                      onClick={(e) => handleDeleteHabito(habit.id, e)}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
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
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-purple-500/30 text-purple-300 px-5 py-3 rounded-full text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
          {notification}
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
                className="text-zinc-500 hover:text-white font-bold p-1 cursor-pointer"
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
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Ler livro, Fazer Cardio, Meditar..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-sans text-sm"
                  id="habit-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Categoria</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold cursor-pointer"
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
                    onChange={(e) => setNewMetaSemanal(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold font-mono cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(v => (
                      <option key={v} value={v}>{v}x na semana</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono mt-2 cursor-pointer shadow-lg shadow-purple-600/15"
                id="habit-submit-button"
              >
                Criar Hábito
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
                className="text-zinc-500 hover:text-white font-bold p-1 cursor-pointer"
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
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do hábito..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Categoria</label>
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold cursor-pointer"
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
                    onChange={(e) => setEditMetaSemanal(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 text-xs font-bold font-mono cursor-pointer"
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
                  className="flex-1 py-3.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider font-mono cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer shadow-lg shadow-purple-600/15 text-center"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
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
}

function HabitFormFields({
  initialHoras,
  initialComment,
  onSave,
  onClose
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
              onClick={() => setMinutos(Math.max(0, minutos - 10))}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors"
            >
              -10m
            </button>
            <button
              type="button"
              onClick={() => setMinutos(Math.max(0, minutos - 5))}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors"
            >
              -5
            </button>
            
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl">
              <input
                type="number"
                value={minutos || ''}
                onChange={(e) => setMinutos(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-10 bg-transparent text-white font-mono text-center text-xs focus:outline-none font-bold"
                placeholder="0"
              />
              <span className="text-[10px] text-zinc-500 font-bold font-mono">min</span>
            </div>

            <button
              type="button"
              onClick={() => setMinutos(minutos + 5)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => setMinutos(minutos + 15)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-bold border border-zinc-800 text-zinc-400 transition-colors"
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Como foi seu desempenho hoje?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all text-xs cursor-pointer text-center uppercase font-mono tracking-wider"
        >
          Salvar Detalhes
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-all text-xs border border-zinc-850 cursor-pointer uppercase font-mono"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
