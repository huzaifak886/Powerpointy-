import React from 'react';
import { ArrowLeft, Sparkles, History, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  view: 'home' | 'guide' | 'history';
  setView: (view: 'home' | 'guide' | 'history') => void;
  handleLogout: () => void;
}

export const Header = React.memo(({ view, setView, handleLogout }: HeaderProps) => {
  return (
    <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {view !== 'home' ? (
          <button 
            onClick={() => setView('home')}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        <h1 className="font-bold text-lg tracking-tight">Powerpointy</h1>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setView('history')}
          className={cn(
            "p-2 rounded-full transition-colors",
            view === 'history' ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          )}
        >
          <History className="w-5 h-5" />
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
});
