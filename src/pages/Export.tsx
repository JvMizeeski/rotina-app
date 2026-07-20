import { useState, useRef } from 'react';
import { FileText, Copy, Check, Download, Brain, HelpCircle, Sparkles, Calendar } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario, formatHorasDedicadas, getLocalDateString } from '../lib/supabase';

export default function Export({ user }: { user: any }) {
  const getInitialDates = () => {
    const today = new Date();
    const past7Days = new Date();
    past7Days.setDate(today.getDate() - 6);
    return {
      today: getLocalDateString(today),
      past7: getLocalDateString(past7Days)
    };
  };

  const dates = getInitialDates();
  const [startDate, setStartDate] = useState<string>(dates.past7);
  const [endDate, setEndDate] = useState<string>(dates.today);
  const [markdown, setMarkdown] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset: '7' | '15' | '30' | 'month') => {
    const today = new Date();
    setEndDate(getLocalDateString(today));

    if (preset === '7') {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setStartDate(getLocalDateString(past));
    } else if (preset === '15') {
      const past = new Date();
      past.setDate(today.getDate() - 14);
      setStartDate(getLocalDateString(past));
    } else if (preset === '30') {
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setStartDate(getLocalDateString(past));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(getLocalDateString(firstDay));
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setCopied(false);

      const startStr = startDate;
      const endStr = endDate;

      // Fetch habits and registers for selected range
      const [habitos, registros] = await Promise.all([
        dataService.getHabitos(user.username),
        dataService.getRegistros(startStr, endStr, user.username)
      ]);

      if (habitos.length === 0) {
        setMarkdown('### Nenhum hábito cadastrado no sistema ainda. Adicione hábitos na tela principal para gerar relatórios!');
        return;
      }

      // Format report header
      let md = `# 📊 RELATÓRIO DE HÁBITOS E ROTINA\n`;
      md += `**Usuário:** ${user.display_name} (@${user.username})\n`;
      md += `**Período:** ${new Date(startStr + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(endStr + 'T12:00:00').toLocaleDateString('pt-BR')}\n`;
      md += `**Gerado em:** ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

      // KPI Summaries
      const completedRegs = registros.filter(r => r.concluido);
      const totalHours = registros.reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);

      md += `## 📈 RESUMO GERAL\n`;
      md += `- **Check-ins Concluídos:** ${completedRegs.length} vezes no período selecionado\n`;
      md += `- **Tempo Total Focado:** ${formatHorasDedicadas(totalHours)}\n\n`;

      // Category breakdown
      md += `## 🗂️ DESEMPENHO POR HÁBITO\n`;
      
      habitos.forEach((habit) => {
        const habitRegs = registros.filter(r => r.habito_id === habit.id);
        const doneCount = habitRegs.filter(r => r.concluido).length;
        const target = habit.meta_semanal;
        
        md += `### 🔹 ${habit.nome} [${habit.categoria}]\n`;
        md += `- **Realizado:** ${doneCount} vezes no período (Meta semanal padrão: ${target} vezes)\n`;
        
        const doneRegs = habitRegs.filter(r => r.concluido);
        if (doneRegs.length > 0) {
          md += `- **Logs Diários:**\n`;
          doneRegs.forEach(reg => {
            const dateFormatted = new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            md += `  - **[${dateFormatted}]** Concluído | Dedicado: ${formatHorasDedicadas(reg.horas_dedicadas)}\n`;
            if (reg.comentario) {
              md += `    *Nota:* "${reg.comentario}"\n`;
            }
          });
        } else {
          md += `- *Nenhum check-in registrado para este hábito neste período.*\n`;
        }
        md += `\n`;
      });

      // Prompt section for Gemini AI
      md += `---\n`;
      md += `## 🤖 SOLICITAÇÃO DE ANÁLISE IA (COPIE COM O TEXTO ACIMA)\n`;
      md += `*Olá Gemini! Analise o meu relatório de rotina e hábitos acima. Identifique padrões de comportamento, gargalos de produtividade, consistência no tempo de dedicação, e me recomende 3 ações práticas personalizadas para otimizar minha consistência na próxima semana.*`;

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Relatório de Desempenho</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Gere relatórios em Markdown prontos para enviar para o Gemini e receber mentoria.
        </p>
      </div>

      {/* Control Card */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 mb-6 flex flex-col items-center text-center">
        <FileText className="text-purple-400 mb-3" size={32} />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Exportação para Inteligência Artificial</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Nossa engine compila todas as métricas, hábitos e anotações subjetivas em um padrão consolidado de alta performance.
        </p>
        
        {/* Date Range Selector */}
        <div className="w-full mt-6 pt-5 border-t border-zinc-800 text-left">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono mb-3">
            <Calendar size={12} className="text-purple-400" />
            <span>Período de Análise</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => applyPreset('7')}
              className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono border bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => applyPreset('15')}
              className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono border bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              Últimos 15 dias
            </button>
            <button
              onClick={() => applyPreset('30')}
              className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono border bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => applyPreset('month')}
              className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono border bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              Este Mês
            </button>
          </div>

          {/* Date Picker Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-1">Data Inicial</label>
              <div className="relative flex items-center bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-colors p-2.5 cursor-pointer">
                <Calendar size={13} className="text-zinc-400 mr-2 shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 font-mono">
                  {startDate ? new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-1">Data Final</label>
              <div className="relative flex items-center bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-colors p-2.5 cursor-pointer">
                <Calendar size={13} className="text-zinc-400 mr-2 shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 font-mono">
                  {endDate ? new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all active:scale-98 mt-5 text-xs uppercase tracking-wider font-mono shadow-lg shadow-purple-600/15 cursor-pointer disabled:opacity-50"
          id="btn-generate-report"
        >
          {loading ? 'Compilando Métricas...' : 'Gerar Relatório'}
        </button>
      </div>

      {/* Preview Output area */}
      {markdown && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles size={12} className="text-purple-400" /> Prévia do Markdown
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                copied
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
              }`}
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
            <Brain className="text-purple-400 shrink-0 mt-0.5" size={18} />
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">Como usar com a IA?</h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                Toque no botão <span className="text-purple-400 font-bold">Copiar Relatório</span> acima, vá para o Gemini, cole o relatório gerado e envie. Ele dará uma análise profunda do seu comportamento corporal, intelectual e mental!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
