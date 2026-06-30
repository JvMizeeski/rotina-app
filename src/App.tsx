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
    <div className="min-h-screen bg-slate-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900" id="app-root">
      {/* Container simulating a mobile phone body when on larger screens */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-zinc-950 border-x border-zinc-900 flex flex-col relative px-5 pt-6 pb-24 shadow-2xl">
        
        {/* Logo and branding header */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles size={16} className="text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest font-sans uppercase">AuraTrack</h2>
            <p className="text-[9px] text-zinc-500 tracking-wider font-mono uppercase">Alta Consistência Mobile</p>
          </div>
        </div>

        {/* Content viewport area */}
        <main className="flex-1">
          {renderActivePage()}
        </main>

        {/* Fixed tactile bottom navigation menu */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800/80 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-around h-20 px-4">
            
            {/* Checklist Tab */}
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'checklist'
                  ? 'text-emerald-400 font-bold scale-105'
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
                  ? 'text-emerald-400 font-bold scale-105'
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
                  ? 'text-emerald-400 font-bold scale-105'
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
