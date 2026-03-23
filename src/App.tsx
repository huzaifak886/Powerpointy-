import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Youtube, 
  ChevronRight, 
  Play, 
  Layers, 
  Settings, 
  Info,
  ArrowLeft,
  Loader2,
  History,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogOut,
  Mail,
  Apple
} from 'lucide-react';
import { generateAnimationGuide, AnimationGuide, AnimationStep } from './services/gemini';
import { cn } from './lib/utils';
import { 
  auth, 
  db, 
  googleProvider, 
  appleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  handleFirestoreError,
  OperationType
} from './firebase';

// Threads-style loading text component
const ThreadsLoading = () => {
  const phrases = [
    "Analyzing professional techniques",
    "Scanning YouTube tutorials",
    "Building your visual guide",
    "Optimizing step-by-step instructions",
    "Generating visual context"
  ];
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

// Simple Error Boundary Fallback
const ErrorFallback = ({ error, resetErrorBoundary }: { error: any, resetErrorBoundary: () => void }) => {
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [history, setHistory] = useState<AnimationGuide[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'home' | 'guide' | 'history'>('home');
  const [currentGuide, setCurrentGuide] = useState<AnimationGuide | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showTips, setShowTips] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync History with Firestore
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'guides'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guides = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          // Convert Firestore Timestamp to ISO string for the UI
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as AnimationGuide;
      });
      setHistory(guides);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guides');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (provider: 'google' | 'apple') => {
    try {
      const result = await signInWithPopup(auth, provider === 'google' ? googleProvider : appleProvider);
      const loggedInUser = result.user;
      
      // Create/Update user profile in Firestore
      await setDoc(doc(db, 'users', loggedInUser.uid), {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        displayName: loggedInUser.displayName,
        photoURL: loggedInUser.photoURL,
        createdAt: Timestamp.now()
      }, { merge: true });

    } catch (error) {
      console.error('Login error:', error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    setIsLoading(true);
    try {
      const guide = await generateAnimationGuide(input, user.uid);
      
      // Save to Firestore
      await setDoc(doc(db, 'guides', guide.id), {
        ...guide,
        createdAt: Timestamp.now() // Use server timestamp for sorting
      });

      setCurrentGuide(guide);
      setView('guide');
      setActiveStepIndex(0);
      setDirection(0);
      setShowTips(false);
      setInput('');
    } catch (error) {
      console.error('Error generating guide:', error);
      alert("I couldn't generate that guide. Please try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // Trigger submit immediately
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => handleSubmit(fakeEvent), 0);
  };

  const selectFromHistory = (guide: AnimationGuide) => {
    setCurrentGuide(guide);
    setView('guide');
    setActiveStepIndex(0);
    setDirection(0);
  };

  const nextStep = () => {
    if (currentGuide && activeStepIndex < currentGuide.steps.length - 1) {
      setDirection(1);
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (activeStepIndex > 0) {
      setDirection(-1);
      setActiveStepIndex(prev => prev - 1);
    }
  };

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

  if (!isAuthReady) {
    return (
      <div className="flex flex-col h-screen w-full md:max-w-md md:mx-auto bg-zinc-950 items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen w-full md:max-w-md md:mx-auto bg-zinc-950 shadow-2xl overflow-hidden font-sans md:border-x border-zinc-800 text-zinc-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex-1 flex flex-col p-8 justify-center space-y-12">
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-900/40">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Powerpointy</h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-[240px] mx-auto">
              The professional guide to cinematic PowerPoint animations.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              className="w-full py-4 px-6 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all"
            >
              <Mail className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleLogin('apple')}
              className="w-full py-4 px-6 bg-zinc-900 border border-zinc-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
            >
              <Apple className="w-5 h-5" />
              Continue with Apple
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest font-medium">
            Securely synced with your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full md:max-w-md md:mx-auto bg-zinc-950 shadow-2xl overflow-hidden font-sans md:border-x border-zinc-800 text-zinc-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence>
          {showInstallBanner && (
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
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'home' && (
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
                {[
                  "Cinematic Morph transition",
                  "3D Parallax slide effect",
                  "Smooth text reveal animation",
                  "Professional dashboard transition"
                ].map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
                  >
                    <span className="text-sm font-medium text-zinc-300">{prompt}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'guide' && currentGuide && (
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
          )}

          {view === 'history' && (
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
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('animation_history');
                  }}
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
                      onClick={() => selectFromHistory(guide)}
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
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-12 relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div 
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-4 border border-indigo-500/30 rounded-[3rem] -z-10"
                />
              </div>
              
              <ThreadsLoading />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area (Only on Home) */}
      {view === 'home' && (
        <div className="p-6 bg-zinc-950 border-t border-zinc-900">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe an animation..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-2 p-2.5 rounded-xl transition-all",
                input.trim() && !isLoading 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                  : "bg-zinc-800 text-zinc-600"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="flex justify-center gap-4 mt-4 opacity-30 grayscale">
            <Youtube className="w-4 h-4" />
            <Layers className="w-4 h-4" />
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadsLoadingText() {
  const words = ["Analyzing", "Tutorials", "Building", "Guide", "Optimizing", "Visuals"];
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
}
