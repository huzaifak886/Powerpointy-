import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const phrases = [
  "Analyzing professional techniques",
  "Scanning YouTube tutorials",
  "Building your visual guide",
  "Optimizing step-by-step instructions",
  "Generating visual context"
];

export const ThreadsLoading = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phrases[index]}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg font-medium text-zinc-200 text-center"
          >
            {phrases[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
          />
        ))}
      </div>
    </div>
  );
};
