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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                <svg className="w-[26px] h-[24px]" viewBox="0 0 416 391" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M302.607 150.001C306.687 159.029 308.632 165.575 310.897 175.178C316.252 206.191 311.537 234.578 293.402 260.888C290.007 265.811 279.567 278.211 274.522 281.26C268.047 287.679 256.038 293.593 247.843 297.473C269.588 322.017 284.548 353.152 320.753 355.616C320.653 366.195 320.638 376.773 320.718 387.352C284.993 385.576 261.532 364.875 240.657 337.995C235.717 331.635 226.123 319.496 220.368 314.901C215.948 311.405 210.818 308.91 205.343 307.59C190.528 304.13 171.718 309.964 159.198 317.874C134.318 333.594 117.045 362.023 110.354 390.164L78.1885 390.2L78.1602 251.409C88.6311 240.712 99.1569 230.069 109.736 219.479L109.65 320.587C130.973 295.976 153.603 280.287 186.442 275.84C200.522 273.933 214.383 276.171 228.118 270.967C230.953 269.893 234.683 268.535 237.583 267.791C241.153 265.472 245.442 263.638 248.957 261.144C277.292 241.047 287.252 207.797 278.317 174.704L283.377 169.653C289.327 163.621 296.622 155.523 302.607 150.001ZM362.222 53.7188C358.557 74.5897 355.012 95.4807 351.582 116.392C349.957 126.285 347.212 140.471 346.437 150.183C337.182 141.957 326.087 130.19 317.112 121.223C303.452 135.549 289.062 149.36 275.172 163.477C274.257 164.405 272.147 166.665 271.157 167.251C267.702 171.129 263.886 174.713 260.236 178.411C238.296 200.652 215.711 222.473 194.026 244.951C173.23 224.308 152.551 203.547 131.99 182.67C127.504 187.127 108.347 207.851 104.539 210.145C102.251 213.001 97.2234 217.82 94.5439 220.503L76.6123 238.442L23.0068 292.621L0 269.687L69.124 200.174C78.1685 191.147 91.1209 176.988 100.258 169.021C102.689 166.026 108.414 160.561 111.342 157.626C118.187 150.818 124.977 143.955 131.709 137.036C151.01 157.763 173.419 179.024 193.526 199.49C210.281 182.568 230.887 160.636 248.052 144.776C257.742 133.622 271.172 121.982 281.507 111.022C285.337 106.96 290.352 102.587 293.807 98.29C285.352 88.8756 274.947 79.9311 266.837 70.9092C287.847 67.2532 308.827 63.4094 329.771 59.3789C340.221 57.4574 351.782 55.0508 362.222 53.7188ZM160.459 81.5811C201.487 80.5206 237.277 79.2051 270.162 108.287L247.767 130.815C219.627 108.703 203.037 114.483 171.764 113.054C167.011 113.141 162.258 113.127 157.506 113.012C156.004 113.202 152.013 113.177 150.434 113.093C126.728 111.827 110.159 117.159 109.68 144.671C101.106 154.268 87.562 167.075 78.1885 176.478C78.1405 164.26 77.9823 151.614 78.1758 139.484C78.4238 123.902 85.3215 107.712 96.9414 97.1416C114.603 81.0746 131.981 80.7555 154.459 81.5625C156.691 81.463 158.225 81.3666 160.459 81.5811ZM382.382 58.2666C390.662 57.8291 402.197 57.7751 410.582 58.4131C416.212 58.8412 418.547 65.8823 412.092 69.5947C403.227 69.6467 393.451 70.0808 384.651 69.4668C377.882 68.995 375.487 62.148 382.382 58.2666ZM398.478 11.0703C420.712 9.94632 382.763 42.991 379.168 44.9609C376.863 45.1749 374.427 44.2826 373.197 42.4141C369.853 37.3637 378.227 29.9669 381.652 26.7363C386.762 21.9254 392.783 15.0118 398.478 11.0703ZM352.747 0C356.392 0.245043 359.367 1.38577 359.467 5.63965C359.692 15.0366 360.216 24.9236 359.151 34.2461C358.966 35.89 356.447 37.041 355.142 37.6445C347.782 37.1255 348.297 32.6076 348.177 26.3291C348.042 19.0887 348.022 11.6591 348.547 4.44727C348.702 2.30391 351.097 1.02546 352.747 0Z" fill="white"/>
                </svg>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-[26px] h-[24px]" viewBox="0 0 416 391" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M302.607 150.001C306.687 159.029 308.632 165.575 310.897 175.178C316.252 206.191 311.537 234.578 293.402 260.888C290.007 265.811 279.567 278.211 274.522 281.26C268.047 287.679 256.038 293.593 247.843 297.473C269.588 322.017 284.548 353.152 320.753 355.616C320.653 366.195 320.638 376.773 320.718 387.352C284.993 385.576 261.532 364.875 240.657 337.995C235.717 331.635 226.123 319.496 220.368 314.901C215.948 311.405 210.818 308.91 205.343 307.59C190.528 304.13 171.718 309.964 159.198 317.874C134.318 333.594 117.045 362.023 110.354 390.164L78.1885 390.2L78.1602 251.409C88.6311 240.712 99.1569 230.069 109.736 219.479L109.65 320.587C130.973 295.976 153.603 280.287 186.442 275.84C200.522 273.933 214.383 276.171 228.118 270.967C230.953 269.893 234.683 268.535 237.583 267.791C241.153 265.472 245.442 263.638 248.957 261.144C277.292 241.047 287.252 207.797 278.317 174.704L283.377 169.653C289.327 163.621 296.622 155.523 302.607 150.001ZM362.222 53.7188C358.557 74.5897 355.012 95.4807 351.582 116.392C349.957 126.285 347.212 140.471 346.437 150.183C337.182 141.957 326.087 130.19 317.112 121.223C303.452 135.549 289.062 149.36 275.172 163.477C274.257 164.405 272.147 166.665 271.157 167.251C267.702 171.129 263.886 174.713 260.236 178.411C238.296 200.652 215.711 222.473 194.026 244.951C173.23 224.308 152.551 203.547 131.99 182.67C127.504 187.127 108.347 207.851 104.539 210.145C102.251 213.001 97.2234 217.82 94.5439 220.503L76.6123 238.442L23.0068 292.621L0 269.687L69.124 200.174C78.1685 191.147 91.1209 176.988 100.258 169.021C102.689 166.026 108.414 160.561 111.342 157.626C118.187 150.818 124.977 143.955 131.709 137.036C151.01 157.763 173.419 179.024 193.526 199.49C210.281 182.568 230.887 160.636 248.052 144.776C257.742 133.622 271.172 121.982 281.507 111.022C285.337 106.96 290.352 102.587 293.807 98.29C285.352 88.8756 274.947 79.9311 266.837 70.9092C287.847 67.2532 308.827 63.4094 329.771 59.3789C340.221 57.4574 351.782 55.0508 362.222 53.7188ZM160.459 81.5811C201.487 80.5206 237.277 79.2051 270.162 108.287L247.767 130.815C219.627 108.703 203.037 114.483 171.764 113.054C167.011 113.141 162.258 113.127 157.506 113.012C156.004 113.202 152.013 113.177 150.434 113.093C126.728 111.827 110.159 117.159 109.68 144.671C101.106 154.268 87.562 167.075 78.1885 176.478C78.1405 164.26 77.9823 151.614 78.1758 139.484C78.4238 123.902 85.3215 107.712 96.9414 97.1416C114.603 81.0746 131.981 80.7555 154.459 81.5625C156.691 81.463 158.225 81.3666 160.459 81.5811ZM382.382 58.2666C390.662 57.8291 402.197 57.7751 410.582 58.4131C416.212 58.8412 418.547 65.8823 412.092 69.5947C403.227 69.6467 393.451 70.0808 384.651 69.4668C377.882 68.995 375.487 62.148 382.382 58.2666ZM398.478 11.0703C420.712 9.94632 382.763 42.991 379.168 44.9609C376.863 45.1749 374.427 44.2826 373.197 42.4141C369.853 37.3637 378.227 29.9669 381.652 26.7363C386.762 21.9254 392.783 15.0118 398.478 11.0703ZM352.747 0C356.392 0.245043 359.367 1.38577 359.467 5.63965C359.692 15.0366 360.216 24.9236 359.151 34.2461C358.966 35.89 356.447 37.041 355.142 37.6445C347.782 37.1255 348.297 32.6076 348.177 26.3291C348.042 19.0887 348.022 11.6591 348.547 4.44727C348.702 2.30391 351.097 1.02546 352.747 0Z" fill="white"/>
                </svg>
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
