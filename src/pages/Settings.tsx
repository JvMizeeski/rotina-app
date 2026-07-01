import { useState, FormEvent } from 'react';
import { Settings as SettingsIcon, User, Lock, Trash2, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';

interface SettingsProps {
  user: any;
  onUpdateUser: (newUser: any) => void;
  onLogout: () => void;
}

export default function Settings({ user, onUpdateUser, onLogout }: SettingsProps) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset confirmation states
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (password && password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await dataService.updatePerfil(
        user.username,
        displayName.trim(),
        password ? password : undefined
      );

      if (res.success && res.user) {
        onUpdateUser(res.user);
        setSuccessMsg('Perfil atualizado com sucesso! ✨');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao atualizar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (resetConfirmText.toLowerCase() !== 'confirmar') {
      setErrorMsg('Digite "confirmar" exatamente para prosseguir.');
      return;
    }

    try {
      setIsResetting(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      
      const success = await dataService.zerarDadosUsuario(user.username);
      
      if (success) {
        setSuccessMsg('Todos os seus dados foram zerados com sucesso! 🧹');
        setIsResetConfirmOpen(false);
        setResetConfirmText('');
      } else {
        setErrorMsg('Erro ao deletar dados do banco de dados.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao tentar zerar dados.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="pb-24 animate-fade-in" id="page-settings">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
          <SettingsIcon size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono uppercase">Gerencie seu perfil e dados</p>
        </div>
      </div>

      {/* Forms Container */}
      <div className="flex flex-col gap-6">
        
        {/* Profile and Security Form */}
        <form onSubmit={handleUpdateProfile} className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono mb-2">
            <User size={16} className="text-purple-400" /> Detalhes da Conta & Segurança
          </h2>

          {/* Feedback banners */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome de usuário (Login)</label>
            <input
              type="text"
              disabled
              value={user.username}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-850 text-zinc-500 font-sans text-xs font-semibold select-none cursor-not-allowed"
            />
            <span className="text-[9px] text-zinc-600 block mt-1 font-mono uppercase">Este identificador único não pode ser alterado.</span>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome de Exibição / Apelido</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: João Vitor"
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-sans text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 border-t border-zinc-850 pt-4">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nova Senha (Opcional)</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Preencha apenas se quiser alterar"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-sans text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada ao lado"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 font-sans text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono mt-3 cursor-pointer shadow-lg shadow-purple-600/15 disabled:opacity-50 text-center"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        {/* Danger Zone Section */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-rose-500/15 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 font-mono">
            <Trash2 size={16} /> Zona de Perigo
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Se você quiser reiniciar sua jornada ou cometeu muitos erros de teste, você pode limpar completamente seu banco de dados. Isso removerá todos os seus hábitos cadastrados e os históricos de checklist permanentemente.
          </p>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full py-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/35 text-rose-400 font-bold transition-all text-xs uppercase tracking-wider font-mono cursor-pointer text-center"
          >
            Zerar Todos os Dados
          </button>
        </div>

      </div>

      {/* Reset Confirmation Overlay Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-rose-500/30 rounded-3xl p-6 shadow-2xl animate-scale-up">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">ATENÇÃO: Ação Irreversível!</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Você está prestes a apagar permanentemente todos os seus hábitos e check-ins no aplicativo. Essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex flex-col gap-4.5">
              <div>
                <label className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2 font-mono text-center">
                  Digite <span className="text-rose-400 font-extrabold">confirmar</span> no campo abaixo para prosseguir:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Digite: confirmar"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 font-mono text-xs text-center font-bold"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    setResetConfirmText('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 font-bold text-xs uppercase tracking-wider font-mono cursor-pointer text-center border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={resetConfirmText.toLowerCase() !== 'confirmar' || isResetting}
                  onClick={handleResetData}
                  className="flex-1 py-3 rounded-xl bg-rose-600 disabled:bg-rose-950/40 disabled:text-rose-900 text-white font-bold hover:bg-rose-700 active:scale-95 transition-all text-xs uppercase tracking-wider font-mono cursor-pointer text-center"
                >
                  {isResetting ? 'Apagando...' : 'Zerar Dados'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
