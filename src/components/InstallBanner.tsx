import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface InstallBannerProps {
  show: boolean;
  onInstall: () => void;
  onClose: () => void;
}

export const InstallBanner = React.memo(({ show, onInstall, onClose }: InstallBannerProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-indigo-600/10 border-b border-indigo-500/20 px-6 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Install Powerpointy</p>
              <p className="text-[10px] text-zinc-400">Add to home screen for a native experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onInstall}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Install
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
