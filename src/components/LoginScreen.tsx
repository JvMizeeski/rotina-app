import { useState, FormEvent } from 'react';
import { Sparkles, User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { dataService } from '../lib/dataService';

interface LoginScreenProps {
  onLoginSuccess: (user: any, remember: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status indicators
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Nome de usuário é obrigatório.');
      return;
    }
    if (!password) {
      setError('A senha é obrigatória.');
      return;
    }

    try {
      setLoading(true);
      if (isSignup) {
        if (!displayName.trim()) {
          setError('Nome de exibição é obrigatório.');
          return;
        }
        const res = await dataService.signup(cleanUsername, password, displayName.trim());
        if (res.success && res.user) {
          setSuccess('Cadastro realizado com sucesso! Redirecionando...');
          setTimeout(() => {
            onLoginSuccess(res.user, rememberMe);
          }, 1500);
        } else {
          setError(res.error || 'Erro ao realizar cadastro.');
        }
      } else {
        const res = await dataService.login(cleanUsername, password);
        if (res.success && res.user) {
          setSuccess('Acesso autorizado! Carregando...');
          setTimeout(() => {
            onLoginSuccess(res.user, rememberMe);
          }, 1000);
        } else {
          setError(res.error || 'Erro ao fazer login.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 select-none" id="login-container">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        
        {/* Animated background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-purple-600/15">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-white uppercase mt-2">Rotina Track</h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-0.5">Construa consistência de alta performance</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-850">
          <button
            type="button"
            onClick={() => {
              setIsSignup(false);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider font-mono cursor-pointer ${
              !isSignup ? 'bg-zinc-900 text-purple-400 shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignup(true);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider font-mono cursor-pointer ${
              isSignup ? 'bg-zinc-900 text-purple-400 shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 animate-bounce" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          
          {isSignup && (
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome de Exibição / Apelido</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Nome de Usuário (Login)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <User size={15} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: joao_vitor"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 font-mono">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Remember Me and terms */}
          <div className="flex items-center justify-between select-none py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded bg-zinc-950 border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-purple-500"
              />
              <span className="text-[10px] text-zinc-400 font-medium font-mono uppercase tracking-wider">Manter-me conectado</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/15 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Processando...' : isSignup ? 'Cadastrar Minha Conta' : 'Entrar na Plataforma'}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

      </div>
    </div>
  );
}
