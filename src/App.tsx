import { useState, useEffect } from 'react';
import Checklist from './pages/Checklist';
import Dashboard from './pages/Dashboard';
import Export from './pages/Export';
import Settings from './pages/Settings';
import LoginScreen from './components/LoginScreen';
import { CheckSquare, BarChart3, FileText, Sparkles, Settings as SettingsIcon, LogOut } from 'lucide-react';

type TabType = 'checklist' | 'dashboard' | 'export' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');
  const [user, setUser] = useState<any | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Check auto login storage
    try {
      const stored = localStorage.getItem('rotina_track_logged_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erro ao ler credenciais salvas:', err);
    } finally {
      setBooting(false);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: any, remember: boolean) => {
    setUser(loggedInUser);
    if (remember) {
      localStorage.setItem('rotina_track_logged_user', JSON.stringify(loggedInUser));
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('rotina_track_logged_user');
      setUser(null);
      setActiveTab('checklist');
    }
  };

  const renderActivePage = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'checklist':
        return <Checklist user={user} />;
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'export':
        return <Export user={user} />;
      case 'settings':
        return <Settings user={user} onUpdateUser={(newUser) => setUser(newUser)} onLogout={handleLogout} />;
      default:
        return <Checklist user={user} />;
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs">
        Carregando ambiente...
      </div>
    );
  }

  // If no user is authenticated, force render Login screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 flex selection:bg-purple-600 selection:text-white font-sans" id="app-root">
      
      {/* ==============================================
          DESKTOP LAYOUT (Visible on md and larger screens)
          ============================================== */}
      <div className="hidden md:flex w-full min-h-screen" id="desktop-layout">
        {/* Left Sidebar */}
        <aside className="w-68 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0">
          <div>
            {/* Logo and branding */}
            <div className="flex items-center gap-2.5 pb-5 border-b border-zinc-900 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                <Sparkles size={18} className="text-white font-bold" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black text-white tracking-wider font-sans uppercase truncate">Rotina Track</h1>
                <p className="text-[10px] text-zinc-500 tracking-wider font-mono uppercase">Alta Performance</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left w-full ${
                  activeTab === 'checklist'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-semibold'
                    : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                id="desktop-nav-checklist"
              >
                <CheckSquare size={18} strokeWidth={activeTab === 'checklist' ? 2.5 : 2} />
                <span className="text-xs font-semibold tracking-wide">Minha Rotina</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left w-full ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-semibold'
                    : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                id="desktop-nav-dashboard"
              >
                <BarChart3 size={18} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
                <span className="text-xs font-semibold tracking-wide">Estatísticas</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left w-full ${
                  activeTab === 'export'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-semibold'
                    : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                id="desktop-nav-export"
              >
                <FileText size={18} strokeWidth={activeTab === 'export' ? 2.5 : 2} />
                <span className="text-xs font-semibold tracking-wide">Relatório Inteligente</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left w-full ${
                  activeTab === 'settings'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-semibold'
                    : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                id="desktop-nav-settings"
              >
                <SettingsIcon size={18} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                <span className="text-xs font-semibold tracking-wide">Configurações</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer with Log out button and developer */}
          <div className="pt-4 border-t border-zinc-900 flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 transition-all cursor-pointer text-left w-full text-xs font-bold font-mono uppercase tracking-wider"
              id="desktop-nav-logout"
            >
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>

            <div className="text-[10px] text-zinc-500 flex flex-col gap-0.5">
              <p className="font-semibold text-zinc-400">Desenvolvido por João Vitor</p>
              <p className="font-mono text-[9px] text-zinc-600">Rotina Track v1</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-zinc-950/40 overflow-y-auto px-8 py-8 md:px-12">
          <div className="max-w-4xl mx-auto w-full">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* ==============================================
          MOBILE LAYOUT (Visible on screens below md)
          ============================================== */}
      <div className="flex md:hidden flex-col w-full min-h-screen bg-zinc-950 relative" id="mobile-layout">
        <div className="w-full flex flex-col relative px-5 pt-6 pb-24 flex-1">
          {/* Logo and branding header */}
          <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={16} className="text-white font-bold" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white tracking-widest font-sans uppercase">Rotina Track</h2>
                <p className="text-[8px] text-zinc-500 tracking-wider font-mono uppercase">Alta Consistência Mobile</p>
              </div>
            </div>
            {/* Log out badge on mobile header */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={11} />
              <span>Sair</span>
            </button>
          </div>

          {/* Content viewport area */}
          <main className="flex-1">
            {renderActivePage()}
          </main>

          {/* Footer signature on mobile */}
          <footer className="mt-12 mb-4 text-center text-[10px] text-zinc-600 font-medium font-sans">
            <p>Desenvolvido por João Vitor Mizeeski</p>
            <p className="font-mono text-[9px] mt-0.5">Rotina Track v1</p>
          </footer>
        </div>

        {/* Fixed tactile bottom navigation menu */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 shadow-2xl">
          <div className="flex items-center justify-around h-20 px-2">
            
            {/* Checklist Tab */}
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'checklist'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-checklist"
            >
              <CheckSquare size={18} strokeWidth={activeTab === 'checklist' ? 2.5 : 2} />
              <span className="text-[9px] tracking-wide font-sans font-semibold uppercase">Hábitos</span>
            </button>

            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-dashboard"
            >
              <BarChart3 size={18} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[9px] tracking-wide font-sans font-semibold uppercase">Status</span>
            </button>

            {/* Export Report Tab */}
            <button
              onClick={() => setActiveTab('export')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-export"
            >
              <FileText size={18} strokeWidth={activeTab === 'export' ? 2.5 : 2} />
              <span className="text-[9px] tracking-wide font-sans font-semibold uppercase">Relatório</span>
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-settings"
            >
              <SettingsIcon size={18} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
              <span className="text-[9px] tracking-wide font-sans font-semibold uppercase">Ajustes</span>
            </button>

          </div>
        </nav>
      </div>

    </div>
  );
}
