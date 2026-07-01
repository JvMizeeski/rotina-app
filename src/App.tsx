import { useState } from 'react';
import Checklist from './pages/Checklist';
import Dashboard from './pages/Dashboard';
import Export from './pages/Export';
import { CheckSquare, BarChart3, FileText, Sparkles } from 'lucide-react';

type TabType = 'checklist' | 'dashboard' | 'export';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'checklist':
        return <Checklist />;
      case 'dashboard':
        return <Dashboard />;
      case 'export':
        return <Export />;
      default:
        return <Checklist />;
    }
  };

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
            </nav>
          </div>

          {/* Sidebar Footer - Developer & Version Info */}
          <div className="pt-4 border-t border-zinc-900 text-[11px] text-zinc-500 flex flex-col gap-1">
            <p className="font-semibold text-zinc-400">Desenvolvido por João Vitor Mizeeski</p>
            <p className="font-mono text-[9px] text-zinc-600">Versão 0</p>
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
                <h2 className="text-sm font-black text-white tracking-widest font-sans uppercase">Rotina Track</h2>
                <p className="text-[9px] text-zinc-500 tracking-wider font-mono uppercase">Alta Consistência Mobile</p>
              </div>
            </div>
            {/* Version Badge on mobile header */}
            <div className="text-right">
              <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono font-bold">v0</span>
            </div>
          </div>

          {/* Content viewport area */}
          <main className="flex-1">
            {renderActivePage()}
          </main>

          {/* Footer signature on mobile */}
          <footer className="mt-12 mb-4 text-center text-[10px] text-zinc-600 font-medium font-sans">
            <p>Desenvolvido por João Vitor Mizeeski</p>
            <p className="font-mono text-[9px] mt-0.5">Versão 0</p>
          </footer>
        </div>

        {/* Fixed tactile bottom navigation menu */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 shadow-2xl">
          <div className="flex items-center justify-around h-20 px-4">
            
            {/* Checklist Tab */}
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'checklist'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-checklist"
            >
              <CheckSquare size={20} strokeWidth={activeTab === 'checklist' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Hábitos</span>
            </button>

            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-dashboard"
            >
              <BarChart3 size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Estatísticas</span>
            </button>

            {/* Export Report Tab */}
            <button
              onClick={() => setActiveTab('export')}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-nav-export"
            >
              <FileText size={20} strokeWidth={activeTab === 'export' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide font-sans font-semibold">Relatório</span>
            </button>

          </div>
        </nav>
      </div>

    </div>
  );
}
