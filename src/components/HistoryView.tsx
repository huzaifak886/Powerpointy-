import React from 'react';
import { motion } from 'motion/react';
import { History, ChevronRight, Layers, Settings, ExternalLink } from 'lucide-react';
import { AnimationGuide } from '../services/gemini';

interface HistoryViewProps {
  history: AnimationGuide[];
  onSelect: (guide: AnimationGuide) => void;
  onClear: () => void;
}

export const HistoryView = React.memo(({ history, onSelect, onClear }: HistoryViewProps) => {
  return (
    <motion.div 
      key="history"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full flex flex-col p-6 space-y-6 overflow-y-auto"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Guides</h2>
        <button 
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
          <History className="w-12 h-12 text-zinc-700" />
          <p className="text-sm text-zinc-500">No guides saved yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((guide) => (
            <button
              key={guide.id}
              onClick={() => onSelect(guide)}
              className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left hover:border-indigo-500/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs text-zinc-500 font-mono mb-1">
                {new Date(guide.createdAt).toLocaleDateString()}
              </p>
              <h4 className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                {guide.title}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                <Layers className="w-3 h-3" /> {guide.steps.length} steps
              </p>
            </button>
          ))}

          <div className="mt-8 p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-zinc-100">Powerpointy</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Install Powerpointy on your phone for full-screen access and offline viewing.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <div className="w-1 h-1 rounded-full bg-indigo-500" />
                <span>iOS: Tap Share <ExternalLink className="w-2 h-2 inline" /> then "Add to Home Screen"</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <div className="w-1 h-1 rounded-full bg-indigo-500" />
                <span>Android: Tap Menu then "Install App"</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
