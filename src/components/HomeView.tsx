import React from 'react';
import { motion } from 'motion/react';
import { Play, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  onQuickPrompt: (prompt: string) => void;
}

const QUICK_IDEAS = [
  "Cinematic Morph transition",
  "3D Parallax slide effect",
  "Smooth text reveal animation",
  "Professional dashboard transition"
];

export const HomeView = React.memo(({ onQuickPrompt }: HomeViewProps) => {
  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col p-6 space-y-8 overflow-y-auto"
    >
      <div className="space-y-4 text-center mt-8">
        <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-indigo-500/20">
          <Play className="w-12 h-12 text-indigo-500 fill-indigo-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Animate your vision.</h2>
        <p className="text-zinc-400 text-sm max-w-[280px] mx-auto leading-relaxed">
          Describe any PowerPoint animation. I'll search YouTube and build a step-by-step visual guide for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-1">Quick Ideas</p>
        {QUICK_IDEAS.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onQuickPrompt(prompt)}
            className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
          >
            <span className="text-sm font-medium text-zinc-300">{prompt}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});
