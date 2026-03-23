import React from 'react';
import { X } from 'lucide-react';

export const ErrorFallback = ({ error, resetErrorBoundary }: { error: any, resetErrorBoundary: () => void }) => {
  let errorMessage = "An unexpected error occurred.";
  try {
    const parsed = JSON.parse(error.message);
    if (parsed.error.includes("insufficient permissions")) {
      errorMessage = "Security Check: You don't have permission to perform this action.";
    }
  } catch (e) {
    errorMessage = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-950">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <X className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{errorMessage}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
      >
        Try Again
      </button>
    </div>
  );
};
