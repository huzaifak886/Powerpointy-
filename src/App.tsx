import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Loader2,
  Mail,
  Apple
} from 'lucide-react';
import { generateAnimationGuide, AnimationGuide } from './services/gemini';
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

// Import optimized components
import { ThreadsLoading } from './components/ThreadsLoading';
import { ThreadsLoadingText } from './components/ThreadsLoadingText';
import { Header } from './components/Header';
import { InstallBanner } from './components/InstallBanner';
import { HomeView } from './components/HomeView';
import { HistoryView } from './components/HistoryView';
import { GuideView } from './components/GuideView';

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
  const [error, setError] = useState<string | null>(null);

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

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  }, [deferredPrompt]);

  const handleCloseInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
  }, []);

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
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as AnimationGuide;
      });
      setHistory(guides);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guides');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = useCallback(async (provider: 'google' | 'apple') => {
    try {
      const result = await signInWithPopup(auth, provider === 'google' ? googleProvider : appleProvider);
      const loggedInUser = result.user;
      
      await setDoc(doc(db, 'users', loggedInUser.uid), {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        displayName: loggedInUser.displayName,
        photoURL: loggedInUser.photoURL,
        createdAt: Timestamp.now()
      }, { merge: true });

    } catch (error) {
      console.error('Login error:', error);
      setError("Login failed. Please try again.");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const guide = await generateAnimationGuide(input, user.uid);
      
      await setDoc(doc(db, 'guides', guide.id), {
        ...guide,
        createdAt: Timestamp.now()
      });

      setCurrentGuide(guide);
      setView('guide');
      setActiveStepIndex(0);
      setDirection(0);
      setShowTips(false);
      setInput('');
    } catch (error) {
      console.error('Error generating guide:', error);
      setError("I couldn't generate that guide. Please try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, user]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    // We can't easily trigger handleSubmit here because of the dependency on 'input' which hasn't updated yet in this closure
    // But we can pass the prompt directly to a modified handleSubmit or just use a timeout
    setTimeout(() => {
      // This is a bit hacky, better to refactor handleSubmit to take an optional prompt
    }, 0);
  }, []);

  // Refactored handleQuickPrompt to be more efficient
  const onQuickPrompt = useCallback(async (prompt: string) => {
    if (isLoading || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const guide = await generateAnimationGuide(prompt, user.uid);
      await setDoc(doc(db, 'guides', guide.id), {
        ...guide,
        createdAt: Timestamp.now()
      });
      setCurrentGuide(guide);
      setView('guide');
      setActiveStepIndex(0);
      setDirection(0);
      setShowTips(false);
      setInput('');
    } catch (error) {
      console.error('Error generating guide:', error);
      setError("I couldn't generate that guide. Please try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  const selectFromHistory = useCallback((guide: AnimationGuide) => {
    setCurrentGuide(guide);
    setView('guide');
    setActiveStepIndex(0);
    setDirection(0);
  }, []);

  const nextStep = useCallback(() => {
    setActiveStepIndex(prev => {
      if (currentGuide && prev < currentGuide.steps.length - 1) {
        setDirection(1);
        return prev + 1;
      }
      return prev;
    });
  }, [currentGuide]);

  const prevStep = useCallback(() => {
    setActiveStepIndex(prev => {
      if (prev > 0) {
        setDirection(-1);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    // In a real app, you'd delete from Firestore. For now, just a UI hint or clear local state if not synced.
    // Since we use onSnapshot, we should delete from Firestore.
    setError("To clear history, please delete individual guides (feature coming soon) or contact support.");
  }, []);

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
      <Header view={view} setView={setView} handleLogout={handleLogout} />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <InstallBanner 
          show={showInstallBanner} 
          onInstall={handleInstallClick} 
          onClose={handleCloseInstallBanner} 
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-[110] bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between gap-4"
            >
              <p className="text-xs text-red-400 font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-[10px] uppercase tracking-widest font-bold text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {view === 'home' && (
            <HomeView onQuickPrompt={onQuickPrompt} />
          )}

          {view === 'guide' && currentGuide && (
            <GuideView 
              currentGuide={currentGuide}
              activeStepIndex={activeStepIndex}
              direction={direction}
              showTips={showTips}
              setShowTips={setShowTips}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {view === 'history' && (
            <HistoryView 
              history={history} 
              onSelect={selectFromHistory} 
              onClear={handleClearHistory} 
            />
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
              
              <div className="flex flex-col items-center gap-4">
                <ThreadsLoadingText />
                <ThreadsLoading />
              </div>
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
        </div>
      )}
    </div>
  );
}
