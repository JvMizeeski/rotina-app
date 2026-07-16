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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-purple-600/15">
            <svg className="w-[30px] h-[28px]" viewBox="0 0 416 391" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M302.607 150.001C306.687 159.029 308.632 165.575 310.897 175.178C316.252 206.191 311.537 234.578 293.402 260.888C290.007 265.811 279.567 278.211 274.522 281.26C268.047 287.679 256.038 293.593 247.843 297.473C269.588 322.017 284.548 353.152 320.753 355.616C320.653 366.195 320.638 376.773 320.718 387.352C284.993 385.576 261.532 364.875 240.657 337.995C235.717 331.635 226.123 319.496 220.368 314.901C215.948 311.405 210.818 308.91 205.343 307.59C190.528 304.13 171.718 309.964 159.198 317.874C134.318 333.594 117.045 362.023 110.354 390.164L78.1885 390.2L78.1602 251.409C88.6311 240.712 99.1569 230.069 109.736 219.479L109.65 320.587C130.973 295.976 153.603 280.287 186.442 275.84C200.522 273.933 214.383 276.171 228.118 270.967C230.953 269.893 234.683 268.535 237.583 267.791C241.153 265.472 245.442 263.638 248.957 261.144C277.292 241.047 287.252 207.797 278.317 174.704L283.377 169.653C289.327 163.621 296.622 155.523 302.607 150.001ZM362.222 53.7188C358.557 74.5897 355.012 95.4807 351.582 116.392C349.957 126.285 347.212 140.471 346.437 150.183C337.182 141.957 326.087 130.19 317.112 121.223C303.452 135.549 289.062 149.36 275.172 163.477C274.257 164.405 272.147 166.665 271.157 167.251C267.702 171.129 263.886 174.713 260.236 178.411C238.296 200.652 215.711 222.473 194.026 244.951C173.23 224.308 152.551 203.547 131.99 182.67C127.504 187.127 108.347 207.851 104.539 210.145C102.251 213.001 97.2234 217.82 94.5439 220.503L76.6123 238.442L23.0068 292.621L0 269.687L69.124 200.174C78.1685 191.147 91.1209 176.988 100.258 169.021C102.689 166.026 108.414 160.561 111.342 157.626C118.187 150.818 124.977 143.955 131.709 137.036C151.01 157.763 173.419 179.024 193.526 199.49C210.281 182.568 230.887 160.636 248.052 144.776C257.742 133.622 271.172 121.982 281.507 111.022C285.337 106.96 290.352 102.587 293.807 98.29C285.352 88.8756 274.947 79.9311 266.837 70.9092C287.847 67.2532 308.827 63.4094 329.771 59.3789C340.221 57.4574 351.782 55.0508 362.222 53.7188ZM160.459 81.5811C201.487 80.5206 237.277 79.2051 270.162 108.287L247.767 130.815C219.627 108.703 203.037 114.483 171.764 113.054C167.011 113.141 162.258 113.127 157.506 113.012C156.004 113.202 152.013 113.177 150.434 113.093C126.728 111.827 110.159 117.159 109.68 144.671C101.106 154.268 87.562 167.075 78.1885 176.478C78.1405 164.26 77.9823 151.614 78.1758 139.484C78.4238 123.902 85.3215 107.712 96.9414 97.1416C114.603 81.0746 131.981 80.7555 154.459 81.5625C156.691 81.463 158.225 81.3666 160.459 81.5811ZM382.382 58.2666C390.662 57.8291 402.197 57.7751 410.582 58.4131C416.212 58.8412 418.547 65.8823 412.092 69.5947C403.227 69.6467 393.451 70.0808 384.651 69.4668C377.882 68.995 375.487 62.148 382.382 58.2666ZM398.478 11.0703C420.712 9.94632 382.763 42.991 379.168 44.9609C376.863 45.1749 374.427 44.2826 373.197 42.4141C369.853 37.3637 378.227 29.9669 381.652 26.7363C386.762 21.9254 392.783 15.0118 398.478 11.0703ZM352.747 0C356.392 0.245043 359.367 1.38577 359.467 5.63965C359.692 15.0366 360.216 24.9236 359.151 34.2461C358.966 35.89 356.447 37.041 355.142 37.6445C347.782 37.1255 348.297 32.6076 348.177 26.3291C348.042 19.0887 348.022 11.6591 348.547 4.44727C348.702 2.30391 351.097 1.02546 352.747 0Z" fill="white"/>
            </svg>
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
