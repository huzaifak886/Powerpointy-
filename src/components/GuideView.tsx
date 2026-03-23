import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Layers, ChevronUp, ChevronDown, X, Sparkles, Youtube, ExternalLink } from 'lucide-react';
import { AnimationGuide } from '../services/gemini';
import { cn } from '../lib/utils';

interface GuideViewProps {
  currentGuide: AnimationGuide;
  activeStepIndex: number;
  direction: number;
  showTips: boolean;
  setShowTips: (show: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 600 : direction < 0 ? -600 : 0,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    y: direction < 0 ? 600 : direction > 0 ? -600 : 0,
    opacity: 0,
    scale: 0.9,
  }),
};

export const GuideView = React.memo(({ 
  currentGuide, 
  activeStepIndex, 
  direction, 
  showTips, 
  setShowTips, 
  nextStep, 
  prevStep 
}: GuideViewProps) => {
  return (
    <motion.div 
      key="guide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* Progress Bar */}
      <div className="px-6 py-3 flex gap-1">
        {currentGuide.steps.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= activeStepIndex ? "bg-indigo-500" : "bg-zinc-800"
            )}
          />
        ))}
      </div>

      {/* Step Title & Counter */}
      <div className="px-6 py-2 flex justify-between items-end">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white leading-tight">
            {currentGuide.title}
          </h3>
        </div>
        <button 
          onClick={() => setShowTips(true)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-400 hover:bg-zinc-800 transition-colors ml-4"
          title="Tips & Resources"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 relative mt-4 px-6 overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={activeStepIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -100) nextStep();
                if (info.offset.y > 100) prevStep();
              }}
              transition={{ 
                y: { type: "spring", damping: 30, stiffness: 200 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl touch-none cursor-grab active:cursor-grabbing"
            >
              {/* Mock Screenshot Area */}
              <div className="aspect-video bg-zinc-800 relative group overflow-hidden shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${currentGuide.id}-${activeStepIndex}/800/450?grayscale`}
                  alt="Step Screenshot"
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-indigo-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-3">
                    <p className="text-[10px] text-indigo-300 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Visual Context
                    </p>
                    <p className="text-xs text-zinc-200 italic leading-snug">
                      {currentGuide.steps[activeStepIndex].screenshotPrompt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Area - Steps Fashion */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 font-bold text-lg shadow-lg shadow-indigo-900/20">
                    {activeStepIndex + 1}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white leading-tight">
                      {currentGuide.steps[activeStepIndex].title}
                    </h4>
                    <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                  </div>
                </div>
                
                <div className="relative pl-14">
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-zinc-800" />
                  <div className="space-y-4">
                    {currentGuide.steps[activeStepIndex].description.split('. ').map((sentence, idx) => (
                      sentence.trim() && (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 z-10" />
                          <p className="text-zinc-300 text-sm leading-relaxed">
                            {sentence.trim()}{sentence.endsWith('.') ? '' : '.'}
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Swipe Hint */}
              <div className="py-3 bg-zinc-950/50 border-t border-zinc-800 flex flex-col items-center justify-center gap-1">
                <div className="flex gap-1">
                  <ChevronUp className={cn("w-4 h-4 text-zinc-600", activeStepIndex === 0 && "opacity-20")} />
                  <ChevronDown className={cn("w-4 h-4 text-zinc-600 animate-bounce", activeStepIndex === currentGuide.steps.length - 1 && "opacity-20 animate-none")} />
                </div>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                  Swipe up to continue
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Refinement Tips Drawer (Peek) */}
      <div className="px-6 py-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Progress</p>
            <p className="text-xs text-zinc-300">Step {activeStepIndex + 1} of {currentGuide.steps.length}</p>
          </div>
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-indigo-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips & Resources Modal */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/95 z-[60] flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Tips & Resources</h3>
              <button 
                onClick={() => setShowTips(false)}
                className="p-2 bg-zinc-900 rounded-full text-zinc-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Professional Tips
                </h4>
                <ul className="space-y-3">
                  {currentGuide.refinementTips.map((tip, i) => (
                    <li key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>

              {currentGuide.youtubeReferences && currentGuide.youtubeReferences.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <Youtube className="w-4 h-4" /> YouTube References
                  </h4>
                  <div className="space-y-3">
                    {currentGuide.youtubeReferences.map((ref, i) => (
                      <div key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center group">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">{ref.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">Search on YouTube</p>
                        </div>
                        <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
