import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const words = ["Analyzing", "Tutorials", "Building", "Guide", "Optimizing", "Visuals"];

export const ThreadsLoadingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.p
          key={words[index]}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          {words[index]}...
        </motion.p>
      </AnimatePresence>
      <motion.p 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-zinc-500 text-xs uppercase tracking-widest font-medium"
      >
        Scanning professional techniques
      </motion.p>
    </div>
  );
};
