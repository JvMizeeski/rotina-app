import { useState, useEffect, FormEvent, MouseEvent } from 'react';
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
                className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-500/30 shadow-md shadow-emerald-950/10'
                    : 'bg-zinc-900 border-zinc-800/60'
                }`}
                id={`habit-card-${habit.id}`}
              >
                {/* Master click area - optimized for mobile (large target) */}
                <div 
                  className="flex items-center justify-between p-4.5 gap-3 cursor-pointer select-none active:bg-zinc-800/20"
                  onClick={() => handleToggleConcluido(habit.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Circle Check Icon (Tactile trigger area) */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950 text-transparent'
                      }`}
                    >
                      <Check size={20} strokeWidth={3.5} className={isCompleted ? 'block' : 'opacity-0'} />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`text-base font-semibold leading-snug truncate transition-colors ${
                          isCompleted ? 'text-emerald-300' : 'text-zinc-200'
                        }`}
                      >
                        {habit.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeColor(habit.categoria)}`}>
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

                  {/* Right side expand / trash tools */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Expand Detail toggle */}
                    <button
                      onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
                      title="Detalhar registro"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {/* Delete habit */}
                    <button
                      onClick={(e) => handleDeleteHabito(habit.id, e)}
                      className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Excluir hábito"
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

      {/* Floating Notification Toast */}
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
                  id="habit-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">CATEGORIA</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 text-sm cursor-pointer"
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
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(v => (
                      <option key={v} value={v}>{v}x na semana</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 active:scale-95 transition-all text-sm mt-2 cursor-pointer shadow-lg shadow-emerald-500/15"
                id="habit-submit-button"
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
        {/* Hours Log slider / input */}
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

        {/* Mood Selector Buttons */}
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
                  className={`py-2 rounded-lg text-lg transition-transform duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 scale-105'
                      : 'hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Note input */}
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
}
