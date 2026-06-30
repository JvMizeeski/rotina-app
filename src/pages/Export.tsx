import { useState } from 'react';
import { FileText, Copy, Check, Download, Brain, HelpCircle, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import { Habito, RegistroDiario } from '../lib/supabase';

export default function Export() {
  const [markdown, setMarkdown] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      setCopied(false);

      // Get last 7 days date range
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 6); // past 7 days inclusive

      const startStr = pastDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      // Fetch habits and registers for last 7 days
      const [habitos, registros] = await Promise.all([
        dataService.getHabitos(),
        dataService.getRegistros(startStr, endStr)
      ]);

      if (habitos.length === 0) {
        setMarkdown('### Nenhum hábito cadastrado no sistema ainda. Adicione hábitos na tela principal para gerar relatórios!');
        return;
      }

      // Format report header
      let md = `# 📊 RELATÓRIO SEMANAL DE HÁBITOS E ROTINA\n`;
      md += `**Período:** ${new Date(startStr + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(endStr + 'T12:00:00').toLocaleDateString('pt-BR')}\n`;
      md += `**Gerado em:** ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

      // KPI Summaries
      const completedRegs = registros.filter(r => r.concluido);
      const totalHours = registros.reduce((sum, r) => sum + (Number(r.horas_dedicadas) || 0), 0);
      const validMoods = registros.filter(r => r.nota_humor > 0).map(r => r.nota_humor);
      const avgMood = validMoods.length > 0 ? (validMoods.reduce((s, m) => s + m, 0) / validMoods.length).toFixed(1) : 'N/A';

      md += `## 📈 RESUMO GERAL\n`;
      md += `- **Check-ins Concluídos:** ${completedRegs.length} vezes nesta semana\n`;
      md += `- **Tempo Total Focado:** ${totalHours} horas dedicadas\n`;
      md += `- **Média de Humor:** ${avgMood} / 5.0\n\n`;

      // Category breakdown
      md += `## 🗂️ DESEMPENHO POR HÁBITO\n`;
      
      habitos.forEach((habit) => {
        const habitRegs = registros.filter(r => r.habito_id === habit.id);
        const doneCount = habitRegs.filter(r => r.concluido).length;
        const target = habit.meta_semanal;
        const percent = target > 0 ? Math.round((doneCount / target) * 100) : 0;
        
        md += `### 🔹 ${habit.nome} [${habit.categoria}]\n`;
        md += `- **Meta Semanal:** ${target} vezes | **Realizado:** ${doneCount} vezes (${percent}%)\n`;
        
        const doneRegs = habitRegs.filter(r => r.concluido);
        if (doneRegs.length > 0) {
          md += `- **Logs Diários:**\n`;
          doneRegs.forEach(reg => {
            const dateFormatted = new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const moodMap = ['😢 Pessimista', '😕 Desanimado', '😐 Neutro', '🙂 Produtivo', '🤩 Excelente'];
            const moodLabel = reg.nota_humor > 0 ? moodMap[reg.nota_humor - 1] : 'Sem registro';
            
            md += `  - **[${dateFormatted}]** Concluído | Dedicado: ${reg.horas_dedicadas}h | Humor: ${moodLabel}\n`;
            if (reg.comentario) {
              md += `    *Nota:* "${reg.comentario}"\n`;
            }
          });
        } else {
          md += `- *Nenhum check-in registrado para este hábito nos últimos 7 dias.*\n`;
        }
        md += `\n`;
      });

      // Prompt section for Gemini AI
      md += `---\n`;
      md += `## 🤖 SOLICITAÇÃO DE ANÁLISE IA (COPIE COM O TEXTO ACIMA)\n`;
      md += `*Olá Gemini! Analise o meu relatório de rotina e hábitos acima. Identifique padrões de comportamento, gargalos de produtividade, correlações entre humor e dedicação horária, e me recomende 3 ações práticas personalizadas para otimizar minha consistência na próxima semana.*`;

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

      {/* Preview Output area */}
      {markdown && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-400" /> Prévia do Markdown
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                copied
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
}
