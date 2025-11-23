import React, { useState, useEffect } from 'react';
import { Beer, LogEntry, ViewState } from './types';
import { searchBeersWithGemini, getTrendingBeers } from './services/geminiService';
import { auth, isFirebaseReady, initError, signInWithGoogle, logout, subscribeToUserData, saveBeerLogToCloud } from './services/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { FunkyButton, FunkyCard, FunkyInput, FunkyBadge, FunkyToast } from './components/FunkyComponents';
import { 
  Beer as BeerIcon, 
  Search, 
  Home, 
  History, 
  ChevronLeft, 
  Sparkles, 
  User,
  Loader2,
  Trophy,
  Zap,
  GlassWater,
  ArrowRight,
  LogOut,
  Cloud
} from 'lucide-react';

// --- Helper Components ---

const NavItem: React.FC<{ 
  active: boolean; 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  desktop?: boolean;
}> = ({ active, icon, label, onClick, desktop }) => (
  <button 
    onClick={onClick}
    className={`
      transition-all duration-200 flex items-center gap-2 group
      ${desktop 
        ? `px-5 py-2.5 rounded-full font-bold text-sm ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}` 
        : `flex-col justify-center w-full py-3 relative ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-500'}`
      }
    `}
  >
    <div className={`relative ${!desktop && active ? '-translate-y-1 transition-transform duration-300' : ''}`}>
      {icon}
      {!desktop && active && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
      )}
    </div>
    {desktop && <span>{label}</span>}
  </button>
);

// --- Login Screen Component ---
const LoginScreen = ({ onLogin, onGuest }: { onLogin: () => void, onGuest: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            if (!isFirebaseReady) {
                throw new Error(`Connection Failed: ${initError?.message || "Unknown init error"}`);
            }
            await signInWithGoogle();
            onLogin();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Login failed");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-indigo-900/50 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner">
                    🍺
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">BeerCount</h1>
                <p className="text-slate-500 mb-8 font-medium">Track your sips, find new favorites, and never forget a pint.</p>

                <div className="space-y-4">
                    <FunkyButton onClick={handleGoogle} isLoading={loading} className="bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-[#4285F4]/30">
                        <div className="w-5 h-5 bg-white rounded-full mr-2 flex items-center justify-center">
                           <span className="text-[#4285F4] font-bold text-xs">G</span>
                        </div>
                        Sign in with Google
                    </FunkyButton>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-300 font-bold">Or</span></div>
                    </div>

                    <FunkyButton variant="secondary" onClick={onGuest}>
                        Continue as Guest
                    </FunkyButton>
                </div>

                {error && (
                    <div className="mt-6 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium break-words text-left">
                        ⚠️ {error}
                    </div>
                )}
                
                {!isFirebaseReady && !error && (
                    <p className="mt-4 text-[10px] text-slate-400">
                        *Cloud services connecting... (If this persists, verify API keys)
                    </p>
                )}
            </div>
        </div>
    );
}

// --- Main App Component ---

export default function App() {
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // App State
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [myBeers, setMyBeers] = useState<Beer[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Beer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedTrending, setHasLoadedTrending] = useState(false);

  // --- Auth & Data Subscription ---
  useEffect(() => {
      // Give Firebase a moment to initialize or fail
      const timer = setTimeout(() => {
         // If still not ready after timeout, just show the login screen (it will display specific error on click)
         setAuthChecked(true);
      }, 1000);

      if (auth) {
        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            setAuthChecked(true);
            if (firebaseUser) setIsGuest(false);
        });
        return () => { clearTimeout(timer); unsubscribeAuth(); }
      }
      
      return () => clearTimeout(timer);
  }, []);

  // --- Data Sync Logic ---
  useEffect(() => {
      if (user && !isGuest) {
          // Real-time Cloud Sync
          const unsubscribeData = subscribeToUserData(user.uid, (data) => {
              setLogs(data.logs);
              setMyBeers(data.beers);
          });
          return () => unsubscribeData();
      } else {
          // Local Storage Fallback (Guest Mode)
          const savedBeers = localStorage.getItem('beers');
          const savedLogs = localStorage.getItem('logs');
          if (savedBeers) setMyBeers(JSON.parse(savedBeers));
          if (savedLogs) setLogs(JSON.parse(savedLogs));
      }
  }, [user, isGuest]);

  // --- Save Logic (Updates when logs/beers change in Guest Mode) ---
  useEffect(() => {
      if (isGuest || !user) {
          localStorage.setItem('beers', JSON.stringify(myBeers));
          localStorage.setItem('logs', JSON.stringify(logs));
      }
  }, [myBeers, logs, isGuest, user]);

  // --- Auto-load Trending on Search View ---
  useEffect(() => {
    if (view === ViewState.SEARCH && !hasLoadedTrending && searchResults.length === 0) {
      const loadTrending = async () => {
        setIsSearching(true);
        const trending = await getTrendingBeers();
        setSearchResults(trending);
        setIsSearching(false);
        setHasLoadedTrending(true);
      };
      loadTrending();
    }
  }, [view, hasLoadedTrending, searchResults.length]);

  // --- Actions ---

  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  const handleAddBeerLog = (beer: Beer) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      beerId: beer.id,
      timestamp: Date.now(),
    };

    if (user && !isGuest) {
        // Save to Cloud
        saveBeerLogToCloud(user.uid, newLog, beer);
        // Optimistic UI update is handled by onSnapshot usually, but we can do it here for instant feel
        // However, since we have a snapshot listener, we can just wait for it or update local state.
        // For smoothness, let's rely on the snapshot listener for truth, but show Toast immediately.
    } else {
        // Save to Local
        if (!myBeers.find(b => b.id === beer.id)) {
            setMyBeers(prev => [...prev, beer]);
        }
        setLogs(prev => [newLog, ...prev]);
    }

    showToast(`+1 ${beer.emoji || '🍺'} Chugged!`);
    
    if (view !== ViewState.DETAIL) {
        setSelectedBeer(beer);
        setView(ViewState.DETAIL);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchQuery(query);
    const results = await searchBeersWithGemini(query);
    setSearchResults(results);
    setIsSearching(false);
  }

  const getBeerStats = (beerId: string) => {
    return logs.filter(l => l.beerId === beerId).length;
  };

  const handleLogout = async () => {
      await logout();
      setIsGuest(false); // Reset guest state to show login screen
      setView(ViewState.DASHBOARD);
  };

  // --- Render Views ---

  if (!authChecked) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
      );
  }

  if (!user && !isGuest) {
      return <LoginScreen onLogin={() => {}} onGuest={() => setIsGuest(true)} />;
  }

  const renderDashboard = () => {
    const totalCount = logs.length;
    const uniqueCount = new Set(logs.map(l => l.beerId)).size;
    const recentLogs = logs.slice().sort((a,b) => b.timestamp - a.timestamp).slice(0, 6); 

    return (
      <div className="space-y-8 pb-24 animate-fade-in">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 shadow-2xl shadow-indigo-500/30">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="max-w-lg">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold tracking-wider uppercase">Beta</span>
                        {user ? (
                            <span className="flex items-center gap-1 text-xs font-medium"><Cloud size={12} /> Cloud Synced</span>
                        ) : (
                            <span className="text-xs font-medium">Guest Mode 💾</span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight leading-tight">
                        Your Liquid <br/> Legacy.
                    </h1>
                    <p className="text-indigo-100 text-sm md:text-base font-medium opacity-90 max-w-xs">
                        {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'Legend'}.` : 'Track locally. Sign in to sync.'}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center gap-2 text-indigo-200 mb-1">
                            <GlassWater size={14} className="fill-current" />
                            <p className="text-xs font-bold uppercase tracking-wider">Empty Bottles</p>
                        </div>
                        <p className="text-3xl font-black">{totalCount}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center gap-2 text-teal-200 mb-1">
                            <Trophy size={14} className="fill-current" />
                            <p className="text-xs font-bold uppercase tracking-wider">Distinct Brews</p>
                        </div>
                        <p className="text-3xl font-black">{uniqueCount}</p>
                    </div>
                </div>
            </div>
            {/* Decorative Blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Main Col: Recent Chugs */}
            <div className="lg:col-span-2 space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <History className="w-5 h-5 text-indigo-500" /> Recent Chugs
                    </h2>
                    {logs.length > 0 && (
                      <button onClick={() => setView(ViewState.SEARCH)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">
                         + Pour One
                      </button>
                    )}
                </div>

                {logs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">🍺</div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Your glass is dry</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">Search for a brew (we have thousands!) and log your first round.</p>
                        <div className="max-w-xs mx-auto">
                           <FunkyButton onClick={() => setView(ViewState.SEARCH)}>Start Sipping</FunkyButton>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentLogs.map(log => {
                            const beer = myBeers.find(b => b.id === log.beerId);
                            if (!beer) return null;
                            return (
                                <FunkyCard key={log.id} onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }} className="hover:border-indigo-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {beer.emoji || '🍺'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate text-sm">{beer.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{beer.brewery}</p>
                                            <p className="text-[10px] text-indigo-400 mt-1 font-medium">
                                                {new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                             <FunkyBadge color="indigo">x{getBeerStats(beer.id)}</FunkyBadge>
                                        </div>
                                    </div>
                                </FunkyCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Col: Stats / Badges */}
            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-teal-500" /> Hall of Foam
                    </h3>
                    <div className="space-y-3">
                        <div className={`p-3 rounded-xl flex items-center gap-3 border ${totalCount > 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <span className="text-xl">{totalCount > 0 ? '🌱' : '🔒'}</span>
                            <div className="text-sm font-bold">First Drop</div>
                        </div>
                        <div className={`p-3 rounded-xl flex items-center gap-3 border ${totalCount >= 10 ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <span className="text-xl">{totalCount >= 10 ? '🚀' : '🔒'}</span>
                            <div className="text-sm font-bold">Beer Baron (10)</div>
                        </div>
                         <div className={`p-3 rounded-xl flex items-center gap-3 border ${uniqueCount >= 5 ? 'bg-teal-50 border-teal-100 text-teal-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <span className="text-xl">{uniqueCount >= 5 ? '🌍' : '🔒'}</span>
                            <div className="text-sm font-bold">World Traveler (5 Unique)</div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg hidden md:block relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <h3 className="font-bold mb-2">Parched?</h3>
                        <p className="text-indigo-200 text-sm mb-4">Search our global cellar of 300+ distinct beers.</p>
                        <button onClick={() => setView(ViewState.SEARCH)} className="w-full py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
                            Fill the Fridge
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderSearch = () => {
    const CATEGORIES = [
        { label: "Classic Lagers", query: "Lager" },
        { label: "Hoppy IPAs", query: "IPA" },
        { label: "Rich Stouts", query: "Stout" },
        { label: "Belgian", query: "Belgian" },
        { label: "German", query: "German" },
        { label: "Sours", query: "Sour" },
    ];

    return (
    <div className="space-y-6 pb-24 animate-fade-in min-h-[80vh]">
        <div className="sticky top-[60px] md:top-[70px] bg-[#f8fafc]/95 backdrop-blur-md z-20 py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100/50">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                 <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">The Cellar</h2>
                    <p className="text-slate-500 text-sm hidden md:block">Global database + AI Discovery.</p>
                 </div>
             </div>
             
             <form onSubmit={handleSearch} className="relative max-w-2xl mb-4">
                <FunkyInput 
                    placeholder="Search for a brew (e.g. Guinness, IPA, Asahi...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus={searchResults.length === 0 && !isSearching}
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                    disabled={isSearching}
                >
                    {isSearching ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
             </form>

             <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar mask-linear-fade">
                 {CATEGORIES.map(cat => (
                     <button
                        key={cat.label}
                        onClick={() => performSearch(cat.query)}
                        className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                     >
                        {cat.label}
                     </button>
                 ))}
             </div>
        </div>

        {isSearching ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="font-medium animate-pulse">Scanning the global archives...</p>
             </div>
        ) : (
            <>
                {!searchQuery && <h3 className="font-bold text-slate-600 flex items-center gap-2 text-sm uppercase tracking-wider"><Zap className="w-4 h-4 text-teal-500" /> Bartender's Choice</h3>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map(beer => {
                         // Check if we've logged this beer before to show a badge
                         const count = getBeerStats(beer.id);
                         return (
                            <FunkyCard key={beer.id} onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }} className="hover:border-indigo-200 group transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                                            {beer.emoji || '🍺'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{beer.name}</h4>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{beer.brewery}</p>
                                            <div className="flex gap-2 mt-2">
                                                <FunkyBadge color="indigo">{beer.type}</FunkyBadge>
                                                <FunkyBadge color="slate">{beer.abv}</FunkyBadge>
                                            </div>
                                        </div>
                                    </div>
                                    {count > 0 && <div className="bg-teal-50 text-teal-600 p-1.5 rounded-full"><Trophy size={14} /></div>}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                                     <FunkyButton 
                                        variant="secondary" 
                                        className="flex-1 !py-2 !text-xs"
                                        onClick={(e) => { e.stopPropagation(); setSelectedBeer(beer); setView(ViewState.DETAIL); }}
                                     >
                                        Details
                                     </FunkyButton>
                                     <FunkyButton 
                                        variant="primary" 
                                        className="flex-1 !py-2 !text-xs"
                                        onClick={(e) => { e.stopPropagation(); handleAddBeerLog(beer); }}
                                     >
                                        Pour One
                                     </FunkyButton>
                                </div>
                            </FunkyCard>
                        );
                    })}
                </div>
                
                {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">🤷‍♂️</div>
                        <p className="text-slate-500 font-medium">No brews found.</p>
                    </div>
                )}
            </>
        )}
    </div>
  )};

  const renderDetail = () => {
    if (!selectedBeer) return null;
    const count = getBeerStats(selectedBeer.id);

    return (
      <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
        <button onClick={() => setView(ViewState.SEARCH)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ChevronLeft size={20} /> Back to Cellar
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
             {/* Header */}
             <div className="bg-slate-50 p-8 flex flex-col md:flex-row gap-8 items-center text-center md:text-left border-b border-slate-100">
                 <div className="w-32 h-32 bg-white rounded-full shadow-md flex items-center justify-center text-7xl animate-bounce-slow border-4 border-white">
                     {selectedBeer.emoji || '🍺'}
                 </div>
                 <div className="flex-1">
                     <FunkyBadge color="indigo">{selectedBeer.type}</FunkyBadge>
                     <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-3 mb-1">{selectedBeer.name}</h2>
                     <p className="text-lg text-slate-500 font-medium">{selectedBeer.brewery}</p>
                     
                     <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Zap size={14}/> {selectedBeer.abv}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>Craft Beer</span>
                     </div>
                 </div>
             </div>

             {/* Content */}
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Pub Trivia</h3>
                     <p className="text-slate-700 leading-relaxed text-lg">
                        {selectedBeer.description || "A mysterious brew with no known history. You'll have to taste it to find out."}
                     </p>

                     <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-indigo-900 font-bold text-sm">Pro Tip</p>
                            <p className="text-indigo-700 text-xs mt-1">This beer style is best enjoyed cold, but not frozen.</p>
                        </div>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rounds Survived</h3>
                         <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-800">{count}</span>
                            <span className="text-sm text-slate-500 font-medium mb-1.5">pints tracked</span>
                         </div>
                         <p className="text-xs text-slate-400 mt-2">
                            {count === 0 ? "You haven't logged this one yet." : 
                             count === 1 ? "Just the first taste." : 
                             "You're becoming a regular."}
                         </p>
                     </div>

                     <FunkyButton onClick={() => handleAddBeerLog(selectedBeer)} className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20">
                        Pour One Now <ArrowRight size={20} />
                     </FunkyButton>
                 </div>
             </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    return (
        <div className="pb-24 animate-fade-in space-y-8">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-500" /> My Tab
                </h2>
                {user ? (
                    <button onClick={handleLogout} className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                ) : (
                    <button onClick={() => setIsGuest(false)} className="text-sm text-indigo-600 font-bold flex items-center gap-1 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">
                         Sign In to Cloud
                    </button>
                )}
             </div>

             <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
                 <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/30 border-4 border-white text-white overflow-hidden">
                    {user?.photoURL ? <img src={user.photoURL} alt="User" /> : '😎'}
                 </div>
                 <h3 className="text-2xl font-bold text-slate-800">{user?.displayName || 'Master Brewer'}</h3>
                 <p className="text-slate-500 mb-8">{user ? user.email : 'Level 1 Cicerone in training (Guest)'}</p>

                 <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100">
                     <div>
                         <div className="text-2xl font-black text-indigo-600">{logs.length}</div>
                         <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Pints</div>
                     </div>
                     <div>
                         <div className="text-2xl font-black text-indigo-600">{new Set(logs.map(l=>l.beerId)).size}</div>
                         <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Unique</div>
                     </div>
                     <div>
                         <div className="text-2xl font-black text-indigo-600">{Math.floor(logs.length * 0.33)}L</div>
                         <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Volume</div>
                     </div>
                 </div>
             </div>
             
             {!user && (
                 <div className="bg-indigo-50 rounded-2xl p-6 text-center border border-indigo-100">
                     <p className="text-indigo-800 font-bold mb-2">💾 Data stored on this device only.</p>
                     <p className="text-indigo-600 text-sm mb-4">Sign in to sync your stats across all your devices.</p>
                     <FunkyButton onClick={() => setIsGuest(false)}>Connect Cloud Account</FunkyButton>
                 </div>
             )}
        </div>
    )
  };

  // --- Navigation ---
  const NAV_ITEMS = [
    { id: ViewState.DASHBOARD, label: 'Taproom', icon: <Home size={20} /> },
    { id: ViewState.SEARCH, label: 'Cellar', icon: <Search size={20} /> },
    { id: ViewState.PROFILE, label: 'My Tab', icon: <User size={20} /> },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-600 bg-[#f8fafc]">
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-black text-xl text-slate-800 cursor-pointer"
            onClick={() => setView(ViewState.DASHBOARD)}
          >
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><BeerIcon size={20} /></span> BeerCount
          </div>
          <nav className="flex gap-2">
            {NAV_ITEMS.map(item => (
              <NavItem 
                key={item.id}
                active={view === item.id}
                label={item.label}
                icon={item.icon}
                onClick={() => setView(item.id as ViewState)}
                desktop
              />
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header (Simple) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
           <div className="font-black text-lg text-slate-800 flex items-center gap-2">
              <span className="text-indigo-600"><BeerIcon size={20} /></span> BeerCount
           </div>
           <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              {view === ViewState.DASHBOARD ? 'Taproom' : view === ViewState.SEARCH ? 'Cellar' : 'My Tab'}
           </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        {view === ViewState.DASHBOARD && renderDashboard()}
        {view === ViewState.SEARCH && renderSearch()}
        {view === ViewState.DETAIL && renderDetail()}
        {view === ViewState.PROFILE && renderProfile()}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-1 pb-safe flex justify-between items-end z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map(item => (
          <NavItem 
            key={item.id}
            active={view === item.id}
            label={item.label}
            icon={item.icon}
            onClick={() => setView(item.id as ViewState)}
          />
        ))}
      </nav>

      <FunkyToast message={toast.message} visible={toast.show} />
    </div>
  );
}