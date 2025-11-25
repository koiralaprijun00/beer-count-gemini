import React, { useState, useEffect, useRef } from 'react';
import { Beer, LogEntry, ViewState } from './types';
import { auth, isFirebaseReady, initError, signInWithGoogle, signInWithFacebook, handleRedirectResult, sendMagicLink, completeMagicLinkSignIn, signInWithEmail, signUpWithEmail, logout, subscribeToUserData, saveBeerLogToCloud } from './services/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { FunkyButton, FunkyCard, FunkyInput, FunkyBadge, FunkyToast } from './components/FunkyComponents';
import { fetchCatalogBulk, fetchCatalogBeerFull, fetchCatalogDetailByName, searchCatalogBeers } from './services/localBeerService';
import {
  Beer as BeerIcon,
  Percent,
  Globe2,
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
      transition-all duration-200 flex items-center gap-2 group border-2 border-transparent
      ${desktop
        ? `px-5 py-2.5 font-bold text-sm uppercase tracking-wider ${active ? 'bg-[var(--color-neon-green)] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-500 hover:bg-black hover:text-[var(--color-neon-green)] hover:border-black'}`
        : `flex-col justify-center w-full py-3 relative ${active ? 'text-black bg-[var(--color-neon-green)] border-t-2 border-black' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`
      }
    `}
  >
    <div className={`relative ${!desktop && active ? '-translate-y-1 transition-transform duration-300' : ''}`}>
      {icon}
    </div>
    {desktop && <span>{label}</span>}
  </button>
);

// Helper function to get country flag emoji
const getCountryFlag = (country: string): string => {
  const countryFlags: Record<string, string> = {
    'USA': '🇺🇸',
    'Belgium': '🇧🇪',
    'Germany': '🇩🇪',
    'UK': '🇬🇧',
    'Ireland': '🇮🇪',
    'Mexico': '🇲🇽',
    'Japan': '🇯🇵',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Singapore': '🇸🇬',
    'Thailand': '🇹🇭',
    'Italy': '🇮🇹',
    'Czechia': '🇨🇿',
    'Netherlands': '🇳🇱',
    'China': '🇨🇳',
    'India': '🇮🇳',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Russia': '🇷🇺',
    'Turkey': '🇹🇷',
  };
  return countryFlags[country] || '🌍';
};

// --- Login Screen Component ---
// --- Login Screen Component ---
const LoginScreen = ({
  onLogin,
  onGuest,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword
}: {
  onLogin: () => void,
  onGuest: () => void,
  authMode: 'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify',
  setAuthMode: (mode: 'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify') => void,
  email: string,
  setEmail: (email: string) => void,
  password: string,
  setPassword: (pass: string) => void
}) => {
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Map Firebase error codes to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const errorCode = error?.code || error?.message || '';
    const errorMap: Record<string, string> = {
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/email-not-verified': 'Please verify your email before signing in. Check your inbox for the verification link.',
    };

    return errorMap[errorCode] || 'Something went wrong. Please try again.';
  };

  const handleGoogle = async () => {
    setLoadingState('google');
    setError('');
    try {
      await signInWithGoogle();
      onLogin();
    } catch (e: any) {
      console.error(e);
      setError(getErrorMessage(e));
      setLoadingState(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b-2 border-black mb-8">
        <div className="flex items-center gap-2 font-black text-xl text-black uppercase tracking-tighter">
          <span className="bg-[var(--color-neon-green)] text-black p-1.5 border-2 border-black"><BeerIcon size={20} /></span> ChugLog
        </div>
        <div className="hidden md:flex gap-6 text-sm font-bold text-slate-500">
          <a href="#" className="hover:text-gray-600">Features</a>
          <a href="#" className="hover:text-gray-600">About</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pb-12">

        {/* Left: Content */}
        <div className="space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-[var(--color-neon-green)] text-xs font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]">
            <Sparkles size={12} /> The #1 Beer Tracker
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-black uppercase">
            Every Sip <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-green)] to-black bg-[length:200%_auto] animate-gradient">Tells a Story.</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-md leading-relaxed font-medium">
            Build your liquid legacy. Track your history, discover new favorites from a global catalog, and never forget a great pint again.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            {authMode === 'default' && (
              <>
                {/* Google */}
                <FunkyButton onClick={handleGoogle} isLoading={loadingState === 'google'} className="bg-black text-[var(--color-neon-green)] border-black hover:bg-gray-900 shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]">
                  <span className="w-5 h-5 bg-[var(--color-neon-green)] text-black mr-2 inline-flex items-center justify-center border border-black">
                    <span className="font-bold text-xs">G</span>
                  </span>
                  Sign in with Google
                </FunkyButton>

                {/* Email Options */}
                <div className="grid grid-cols-2 gap-3">
                  <FunkyButton variant="secondary" onClick={() => setAuthMode('magic')}>
                    Magic Link ✨
                  </FunkyButton>
                  <FunkyButton variant="secondary" onClick={() => setAuthMode('email')}>
                    Email/Pass 🔑
                  </FunkyButton>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-400 font-bold">Or</span></div>
                </div>

                <FunkyButton variant="secondary" onClick={onGuest}>
                  Try as Guest
                </FunkyButton>
              </>
            )}

            {authMode === 'magic' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Magic Link Sign In</h3>
                  <button onClick={() => setAuthMode('default')} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Cancel</button>
                </div>
                <p className="text-sm text-slate-500">We'll send a secure link to your email. No password needed.</p>
                <FunkyInput
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FunkyButton onClick={async () => {
                  if (!email) return setError("Email is required");
                  setLoadingState('magic'); setError('');
                  try {
                    await sendMagicLink(email);
                    setAuthMode('magic-success');
                  } catch (e: any) { setError(getErrorMessage(e)); }
                  finally { setLoadingState(null); }
                }} isLoading={loadingState === 'magic'}>
                  Send Magic Link 🪄
                </FunkyButton>
              </div>
            )}

            {authMode === 'magic-success' && (
              <div className="space-y-6 animate-fade-in text-center py-4 border-2 border-black p-6 bg-[var(--color-neon-green)]">
                <div className="w-16 h-16 bg-black text-[var(--color-neon-green)] flex items-center justify-center mx-auto text-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  ✉️
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-slate-800">Check your email!</h3>
                  <p className="text-slate-600 text-sm">
                    We sent a magic link to <span className="font-bold text-slate-800">{email}</span>.
                    <br />Click it to sign in instantly.
                  </p>
                </div>
                <FunkyButton variant="secondary" onClick={() => setAuthMode('default')}>
                  Back to Login
                </FunkyButton>
              </div>
            )}

            {authMode === 'magic-confirm' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Complete Sign In</h3>
                  <button onClick={() => setAuthMode('default')} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Cancel</button>
                </div>
                <div className="bg-blue-50 border-2 border-black p-4 text-left text-sm text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-bold text-black mb-1 uppercase">📧 Email Required</p>
                  <p>Please enter the email address you used to request the magic link.</p>
                </div>
                <FunkyInput
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FunkyButton onClick={async () => {
                  if (!email) return setError("Email is required");
                  setLoadingState('magic-confirm'); setError('');
                  try {
                    await completeMagicLinkSignIn(email);
                    onLogin();
                  } catch (e: any) {
                    setError(getErrorMessage(e));
                  } finally {
                    setLoadingState(null);
                  }
                }} isLoading={loadingState === 'magic-confirm'}>
                  Complete Sign In
                </FunkyButton>
              </div>
            )}

            {authMode === 'email' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Email & Password</h3>
                  <button onClick={() => setAuthMode('default')} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Cancel</button>
                </div>
                <FunkyInput
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FunkyInput
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <FunkyButton onClick={async () => {
                    if (!email || !password) return setError("Email and password required");
                    setLoadingState('email-signin'); setError('');
                    try { await signInWithEmail(email, password); onLogin(); }
                    catch (e: any) { setError(getErrorMessage(e)); setLoadingState(null); }
                  }} isLoading={loadingState === 'email-signin'}>
                    Sign In
                  </FunkyButton>
                  <FunkyButton variant="secondary" onClick={async () => {
                    if (!email || !password) return setError("Email and password required");
                    setLoadingState('email-signup'); setError('');
                    try {
                      await signUpWithEmail(email, password);
                      setAuthMode('email-verify');
                    }
                    catch (e: any) { setError(getErrorMessage(e)); setLoadingState(null); }
                  }} isLoading={loadingState === 'email-signup'}>
                    Sign Up
                  </FunkyButton>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-400 font-bold">Or</span></div>
                </div>

                <FunkyButton onClick={handleGoogle} isLoading={loadingState === 'google'} className="bg-black text-white hover:bg-gray-900 shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]">
                  <span className="w-5 h-5 bg-white text-black mr-2 inline-flex items-center justify-center border border-black">
                    <span className="font-bold text-xs">G</span>
                  </span>
                  Sign in with Google
                </FunkyButton>
              </div>
            )}

            {authMode === 'email-verify' && (
              <div className="space-y-6 animate-fade-in text-center py-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  📧
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-slate-800">Verify your email</h3>
                  <p className="text-slate-600 text-sm">
                    We sent a verification link to <span className="font-bold text-slate-800">{email}</span>.
                    <br />Click the link in your email to activate your account.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left text-sm text-slate-600">
                  <p className="font-bold text-blue-700 mb-2">📌 Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the verification link</li>
                    <li>Return here and sign in</li>
                  </ol>
                </div>
                <FunkyButton variant="secondary" onClick={() => setAuthMode('default')}>
                  Back to Login
                </FunkyButton>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-black uppercase tracking-wider pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-neon-green)] border border-black"></div> No Credit Card
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-neon-green)] border border-black"></div> Free Forever
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-neon-green)] border border-black"></div> Offline Capable
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3 animate-fade-in">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}
        </div>

        {/* Right: Visuals */}
        <div className="relative hidden lg:block h-[600px] border-l-2 border-black pl-12">
          {/* Abstract Background Blobs - REMOVED for Brutalist look */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--color-neon-green)] opacity-20 blur-[100px]"></div>

          {/* Floating Cards Composition */}
          <div className="absolute top-20 left-10 w-72 rotate-[-2deg] hover:rotate-0 transition-transform duration-500 z-10">
            <FunkyCard className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-neon-green)] border-2 border-black text-2xl flex items-center justify-center">🍺</div>
                <div>
                  <h4 className="font-bold text-slate-800">Guinness Draught</h4>
                  <p className="text-xs text-slate-500">Stout • 4.2%</p>
                </div>
              </div>
              <div className="flex gap-2">
                <FunkyBadge color="indigo">Creamy</FunkyBadge>
                <FunkyBadge color="slate">Classic</FunkyBadge>
              </div>
            </FunkyCard>
          </div>

          <div className="absolute top-48 right-10 w-64 rotate-[2deg] hover:rotate-0 transition-transform duration-500 z-20">
            <FunkyCard className="bg-black text-white shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] border-2 border-[var(--color-neon-green)]">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="text-[var(--color-neon-green)]" size={20} />
                <span className="font-bold text-sm uppercase tracking-wider text-gray-400">Achievement</span>
              </div>
              <div className="text-2xl font-black mb-1 uppercase">Beer Baron</div>
              <p className="text-gray-400 text-xs">Logged 10 unique brews.</p>
              <div className="mt-4 h-2 w-full bg-gray-800 border border-gray-700">
                <div className="h-full bg-[var(--color-neon-green)] w-full"></div>
              </div>
            </FunkyCard>
          </div>

          <div className="absolute bottom-20 left-20 w-80 rotate-[-3deg] hover:rotate-0 transition-transform duration-500 z-30">
            <FunkyCard className="shadow-xl shadow-gray-900/5 border-slate-200/60 bg-white">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
                  <p className="text-4xl font-black text-gray-600">42.5 L</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unique</p>
                  <p className="text-2xl font-black text-slate-800">86</p>
                </div>
              </div>
            </FunkyCard>
          </div>
        </div>

      </main>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [authMode, setAuthMode] = useState<'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify'>('default');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // App State
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [myBeers, setMyBeers] = useState<Beer[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Beer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedTrending, setHasLoadedTrending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const [catalogDetail, setCatalogDetail] = useState<Beer | null>(null);
  const [catalogDetailLoading, setCatalogDetailLoading] = useState(false);

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

  // --- Magic Link & Redirect Completion ---
  useEffect(() => {      // Check for Magic Link
    completeMagicLinkSignIn().then(newUser => {
      if (newUser) {
        setUser(newUser);
        setIsGuest(false);
      }
    }).catch(error => {
      if (error.message === "MISSING_EMAIL") {
        setAuthMode('magic-confirm');
      }
    });

    // Check for Redirect Result (Google/Facebook fallback)
    handleRedirectResult().then(newUser => {
      if (newUser) {
        setUser(newUser);
        setIsGuest(false);
      }
    });
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

  // --- Catalog Detail Loader (for catalog beers) ---
  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedBeer) {
        setCatalogDetail(null);
        setCatalogDetailLoading(false);
        return;
      }
      setCatalogDetailLoading(true);
      let detail: Beer | null = null;
      if (selectedBeer.id.startsWith('catalog-')) {
        detail = await fetchCatalogBeerFull(selectedBeer.id);
      } else {
        detail = await fetchCatalogDetailByName(selectedBeer.name);
      }
      setCatalogDetail(detail);
      setCatalogDetailLoading(false);
    };
    loadDetail();
  }, [selectedBeer]);

  // --- Auto-load Trending on Search View ---
  useEffect(() => {
    if (view === ViewState.SEARCH && !hasLoadedTrending && searchResults.length === 0) {
      const loadCatalog = async () => {
        setIsCatalogLoading(true);
        const catalog = await fetchCatalogBulk(1000);
        const normalizeList = (list: Beer[]) => {
          const seen = new Set<string>();
          return list.filter(beer => {
            const key = beer.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };
        const normalized = normalizeList(catalog);
        setAllBeers(normalized);
        setSearchResults(normalized);
        setHasLoadedTrending(true);
        setIsCatalogLoading(false);
      };
      loadCatalog();
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

    // Optimistic UI update so stats move immediately
    if (!myBeers.find(b => b.id === beer.id)) {
      setMyBeers(prev => [...prev, beer]);
    }
    setLogs(prev => [newLog, ...prev]);

    if (user && !isGuest) {
      // Save to Cloud; snapshot will reconcile the optimistic state
      saveBeerLogToCloud(user.uid, newLog, beer).catch(() => {
        showToast("⚠️ Cloud save failed; data may be local only.");
      });
    }

    showToast("🍺 Cheers! Logged successfully.");
  };

  const executeSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setIsSearching(false);
      setSearchResults(allBeers);
      return;
    }
    setIsSearching(true);
    const results = await searchCatalogBeers(trimmed);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const performSearch = async (query: string) => {
    setSearchQuery(query);
    executeSearch(query);
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    if (!value.trim()) {
      setSearchResults(allBeers);
      setIsSearching(false);
      return;
    }
    searchTimer.current = window.setTimeout(() => {
      executeSearch(value);
    }, 300);
  };

  const detectCountry = (beer: Beer): string | null => {
    // Rough heuristic map; easy to extend later or replace with real metadata.
    const label = `${beer.name} ${beer.brewery}`.toLowerCase();
    const entries: { key: string | RegExp; country: string }[] = [
      { key: /modelo|tecate|pacifico|dos equis|cuauhtémoc|sol/, country: 'Mexico' },
      { key: /guinness|murphy|kilkenny/, country: 'Ireland' },
      { key: /heineken|amstel|grolsch/, country: 'Netherlands' },
      { key: /paulaner|spaten|warsteiner|bitburger|beck|hofbräu|kostritzer|weihenstephaner/, country: 'Germany' },
      { key: /asahi|sapporo|kirin/, country: 'Japan' },
      { key: /sierra nevada|bell's|bells|founders|lagunitas|stone|anheuser|bud|coors|miller|new belgium|dogfish|sam adams|goose island|anchor/, country: 'USA' },
      { key: /fuller|samuel smith|bass|newcastle|london|orkney/, country: 'UK' },
      { key: /chimay|duvel|leffe|rochefort|hoegaarden|stella artois|delirium|orval|westmalle|achouffe|lindemans/, country: 'Belgium' },
      { key: /unibroue|molson|labatt|moosehead/, country: 'Canada' },
      { key: /foster|coopers|victoria bitter|xxxx gold/, country: 'Australia' },
      { key: /singha/, country: 'Thailand' },
      { key: /tiger/, country: 'Singapore' },
      { key: /tsingtao/, country: 'China' },
      { key: /peroni|birra moretti/, country: 'Italy' },
      { key: /pilsner urquell|staropramen|koz(e|ě)l/, country: 'Czechia' }
    ];
    const match = entries.find(entry => typeof entry.key === 'string'
      ? label.includes(entry.key)
      : entry.key.test(label));
    return match?.country || null;
  };

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
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <LoginScreen
        onLogin={() => setAuthChecked(true)}
        onGuest={() => setIsGuest(true)}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  const renderDashboard = () => {
    const totalCount = logs.length;
    const uniqueCount = new Set(logs.map(l => l.beerId)).size;
    // Group logs by beer to avoid duplicates in Recent Chugs
    const recentGroupedLogs = (() => {
      const map = new Map<string, { beer: Beer; count: number; latest: number }>();
      logs.forEach(log => {
        const beer = myBeers.find(b => b.id === log.beerId);
        if (!beer) return;
        const existing = map.get(log.beerId);
        if (existing) {
          existing.count += 1;
          if (log.timestamp > existing.latest) existing.latest = log.timestamp;
        } else {
          map.set(log.beerId, { beer, count: 1, latest: log.timestamp });
        }
      });
      return Array.from(map.values())
        .sort((a, b) => b.latest - a.latest);
    })();

    return (
      <div className="space-y-8 pb-24 animate-fade-in">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-black text-white p-8 shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] border-2 border-black">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter leading-none uppercase">
                Your Liquid <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-green)] to-white">Legacy.</span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-medium max-w-xs">
                {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'Legend'}.` : 'Track locally. Sign in to sync.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white text-black p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <GlassWater size={14} className="fill-current" />
                  <p className="text-xs font-bold uppercase tracking-wider">Empty Bottles</p>
                </div>
                <p className="text-4xl font-black">{totalCount}</p>
              </div>
              <div className="bg-[var(--color-neon-green)] text-black p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]">
                <div className="flex items-center gap-2 text-black mb-1">
                  <Trophy size={14} className="fill-current" />
                  <p className="text-xs font-bold uppercase tracking-wider">Distinct Brews</p>
                </div>
                <p className="text-4xl font-black">{uniqueCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left/Main Col: Recent Chugs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" /> Your History
              </h2>
              {logs.length > 0 && (
                <button onClick={() => setView(ViewState.SEARCH)} className="text-sm font-bold text-gray-600 hover:text-gray-700 hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors">
                  + Pour One
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="bg-white p-10 text-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-20 h-20 bg-[var(--color-neon-green)] border-2 border-black flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">🍺</div>
                <h3 className="text-lg font-bold text-black uppercase mb-2">Your glass is dry</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">Search for a brew (we have thousands!) and log your first round.</p>
                <div className="max-w-xs mx-auto">
                  <FunkyButton onClick={() => setView(ViewState.SEARCH)}>Start Sipping</FunkyButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentGroupedLogs.map(group => {
                  const { beer, count, latest } = group;
                  return (
                    <FunkyCard key={beer.id} onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }} className="hover:border-black text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-black text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          {beer.emoji || '🍺'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate text-sm">{beer.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{beer.brewery}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            {new Date(latest).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <FunkyBadge color="gray">x{count}</FunkyBadge>
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
            <div className="bg-white p-6 border-2 border-black">
              <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[var(--color-neon-green)]" /> Hall of Foam
              </h3>
              <div className="space-y-3">
                <div className={`p-3 flex items-center gap-3 border-2 ${totalCount > 0 ? 'bg-black border-black text-[var(--color-neon-green)]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                  <span className="text-xl">{totalCount > 0 ? '🌱' : '🔒'}</span>
                  <div className="text-sm font-bold uppercase">First Drop</div>
                </div>
                <div className={`p-3 flex items-center gap-3 border-2 ${totalCount >= 10 ? 'bg-black border-black text-[var(--color-neon-green)]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                  <span className="text-xl">{totalCount >= 10 ? '🚀' : '🔒'}</span>
                  <div className="text-sm font-bold uppercase">Beer Baron (10)</div>
                </div>
                <div className={`p-3 flex items-center gap-3 border-2 ${uniqueCount >= 5 ? 'bg-white border-black text-black' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                  <span className="text-xl">{uniqueCount >= 5 ? '🌍' : '🔒'}</span>
                  <div className="text-sm font-bold uppercase">World Traveler (5 Unique)</div>
                </div>
              </div>
            </div>

            <div className="bg-black p-6 text-white hidden md:block relative overflow-hidden border-2 border-black">
              <div className="relative z-10">
                <h3 className="font-bold mb-2 uppercase text-[var(--color-neon-green)]">Parched?</h3>
                <p className="text-gray-300 text-sm mb-4">Search our global cellar of 300+ distinct beers.</p>
                <button onClick={() => setView(ViewState.SEARCH)} className="w-full py-3 bg-white text-black border-2 border-black font-bold hover:bg-[var(--color-neon-green)] transition-colors text-sm uppercase tracking-wider">
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
    const CATEGORY_FILTERS = [
      { label: "Lager", query: "Lager" },
      { label: "IPA", query: "IPA" },
      { label: "Pilsner", query: "Pilsner" },
      { label: "Stout", query: "Stout" },
      { label: "Belgian", query: "Belgian" },
      { label: "Sour", query: "Sour" },
      { label: "Wheat", query: "Wheat" },
    ];

    const COUNTRY_FILTERS = [
      'all', 'USA', 'Belgium', 'Germany', 'UK', 'Ireland', 'Mexico', 'Japan', 'Canada', 'Australia', 'Singapore', 'Thailand', 'Italy', 'Czechia', 'Netherlands', 'China'
    ];

    const filteredResults = searchResults.filter(beer => {
      const matchesCategory = !selectedCategory || beer.type.toLowerCase().includes(selectedCategory.toLowerCase());
      const country = (beer as any).country || detectCountry(beer);
      const matchesCountry = selectedCountry === 'all' || (country && country.toLowerCase() === selectedCountry.toLowerCase());
      return matchesCategory && matchesCountry;
    });

    return (
      <div className="pb-24 animate-fade-in min-h-[80vh]">
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-4 md:sticky md:top-[80px] h-max">
            <div className="bg-white border-2 border-black p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Picks</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_FILTERS.slice(0, 4).map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => { setSelectedCategory(cat.query); setSearchQuery(cat.query); executeSearch(cat.query); }}
                    className={`px-3 py-2 text-sm font-bold border-2 transition-all uppercase ${selectedCategory === cat.query ? 'bg-black text-[var(--color-neon-green)] border-black' : 'border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-[var(--color-neon-green)]'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-black p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style</p>
                {selectedCategory && (
                  <button className="text-[11px] font-bold text-black uppercase hover:underline" onClick={() => { setSelectedCategory(null); setSearchResults(allBeers); }}>Reset</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => { setSelectedCategory(cat.query); setSearchQuery(cat.query); executeSearch(cat.query); }}
                    className={`px-3 py-2 text-xs font-bold border-2 transition-all uppercase ${selectedCategory === cat.query ? 'bg-black text-[var(--color-neon-green)] border-black' : 'border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-[var(--color-neon-green)]'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-black p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Country</p>
                {selectedCountry !== 'all' && (
                  <button className="text-[11px] font-bold text-black uppercase hover:underline" onClick={() => { setSelectedCountry('all'); setSearchResults(allBeers); }}>Reset</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_FILTERS.map(country => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={`px-3 py-2 text-xs font-bold border-2 transition-all uppercase ${selectedCountry === country ? 'bg-[var(--color-neon-green)] text-black border-black' : 'border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-gray-100'}`}
                  >
                    {country === 'all' ? 'All' : country}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="bg-white border-2 border-black p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-black tracking-tighter uppercase">The Cellar</h2>
                  <p className="text-gray-500 text-sm font-medium">Global database + AI Discovery.</p>
                </div>
                {(selectedCategory || selectedCountry !== 'all') && (
                  <button
                    className="text-sm font-bold text-black hover:text-[var(--color-neon-green)] uppercase"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedCountry('all');
                      setSearchQuery('');
                      setSearchResults(allBeers);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <form onSubmit={handleSearch} className="relative">
                <FunkyInput
                  placeholder="Search for a brew (e.g. Guinness, IPA, Asahi...)"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  autoFocus={searchResults.length === 0 && !isSearching}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-2 bg-black border-2 border-black text-[var(--color-neon-green)] hover:bg-gray-900 transition-colors shadow-none"
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
              </form>
            </div>

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-black bg-white border-2 border-black">
                <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                <p className="font-bold uppercase animate-pulse">Scanning the global archives...</p>
              </div>
            ) : isCatalogLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-white border-2 border-black">
                <Loader2 className="w-6 h-6 animate-spin text-black mb-3" />
                <p className="text-sm font-bold uppercase">Loading Catalog.beer listings...</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-slate-600 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-teal-500" /> All Beers
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.map(beer => {
                    const count = getBeerStats(beer.id);
                    const country = (beer as any).country || detectCountry(beer);
                    return (
                      <FunkyCard key={beer.id} onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }} className="shadow-none hover:border-black relative flex flex-col h-full">
                        <div className="flex items-start justify-between gap-4 flex-grow">
                          <div className="flex gap-4 w-full">
                            <div className="w-14 h-14 bg-white text-3xl flex items-center justify-center border-2 border-black overflow-hidden flex-shrink-0">
                              {beer.imageUrl ? (
                                <img src={beer.imageUrl} alt={beer.name} className="w-full h-full object-contain bg-white" />
                              ) : (
                                <span>{beer.emoji || '🍺'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-black leading-tight uppercase pr-2">{beer.name}</h4>
                                {country && (
                                  <div className="relative group">
                                    <span
                                      className="text-2xl cursor-pointer self-start leading-none"
                                    >
                                      {getCountryFlag(country)}
                                    </span>
                                    <span className="absolute -top-8 left-5 bg-black text-white px-2 py-1 text-xs font-bold uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {country}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-bold mb-2 uppercase">{beer.brewery}</p>
                              <div className="flex gap-2 flex-wrap">
                                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white border border-black">
                                  <Sparkles className="w-3 h-3" /> {beer.type}
                                </span>
                                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white text-black border border-black">
                                  <Percent className="w-3 h-3" /> {beer.abv}
                                </span>
                              </div>
                            </div>
                          </div>
                          {count > 0 && <div className="absolute top-2 right-2 bg-[var(--color-neon-green)] text-black p-1.5 border border-black hidden"><Trophy size={14} /></div>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                          <FunkyButton
                            variant="secondary"
                            className="flex-1 !py-2 !text-xs shadow-none hover:shadow-none"
                            onClick={(e) => { e.stopPropagation(); setSelectedBeer(beer); setView(ViewState.DETAIL); }}
                          >
                            Details
                          </FunkyButton>
                          <FunkyButton
                            variant="primary"
                            className="flex-1 !py-2 !text-xs"
                            pulseOnClick
                            pulseDurationMs={750}
                            pressText={<span className="flex items-center gap-1">🎉 <span className="font-bold">Chugged!</span></span>}
                            onClick={(e) => { e.stopPropagation(); handleAddBeerLog(beer); }}
                          >
                            Pour One
                          </FunkyButton>
                        </div>
                      </FunkyCard>
                    );
                  })}
                </div>

                {filteredResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-12 bg-white border-2 border-black">
                    <div className="text-4xl mb-4">🤷‍♂️</div>
                    <p className="text-gray-500 font-bold uppercase">No brews found for that combo. Try another style or clear filters.</p>
                    <button
                      className="mt-4 text-sm font-bold text-black hover:text-[var(--color-neon-green)] uppercase underline"
                      onClick={() => { setSelectedCategory(null); setSelectedCountry('all'); setSearchQuery(''); setSearchResults([]); }}
                    >
                      Reset search
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  };

  const renderDetail = () => {
    if (!selectedBeer) return null;
    const count = getBeerStats(selectedBeer.id);
    const detail = catalogDetail || selectedBeer;

    return (
      <div className="animate-fade-in pb-24 max-w-5xl mx-auto">
        <button onClick={() => setView(ViewState.SEARCH)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors uppercase tracking-wider">
          <ChevronLeft size={20} /> Back to Cellar
        </button>

        <div className="bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden border-2 border-black">
          {/* Header */}
          <div className="bg-white p-8 md:p-10 border-b-2 border-black">
            <div className="grid md:grid-cols-[160px_1fr] gap-8 items-center">
              <div className="w-36 h-36 mx-auto md:mx-0 bg-white flex items-center justify-center text-7xl border-2 border-black overflow-hidden">
                {detail.imageUrl ? (
                  <img src={detail.imageUrl} alt={detail.name} className="w-full h-full object-contain bg-white" />
                ) : (
                  <span>{detail.emoji || '🍺'}</span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex gap-2 items-center flex-wrap">
                  <FunkyBadge color="indigo">{detail.type}</FunkyBadge>
                  {detail.cbVerified && <FunkyBadge color="teal">Catalog Verified</FunkyBadge>}
                  {detail.brewerVerified && <FunkyBadge color="teal">Brewer Verified</FunkyBadge>}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-black leading-none uppercase tracking-tighter">{detail.name}</h2>
                <p className="text-xl text-gray-500 font-bold uppercase">{detail.brewery}</p>
                <div className="flex items-center flex-wrap gap-4 text-sm font-bold text-gray-400 uppercase">
                  <span className="flex items-center gap-1"><Zap size={14} /> {detail.abv}</span>
                  {detail.ibu && (
                    <>
                      <span className="w-1 h-1 bg-gray-300"></span>
                      <span className="flex items-center gap-1">IBU {detail.ibu}</span>
                    </>
                  )}
                  <span className="w-1 h-1 bg-gray-300"></span>
                  <span>Craft Beer</span>
                  {detail.country && (
                    <>
                      <span className="w-1 h-1 bg-gray-300"></span>
                      <span className="flex items-center gap-1">{detail.country}</span>
                    </>
                  )}
                </div>
                {detail.brewerUrl && (
                  <a href={detail.brewerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-black hover:text-[var(--color-neon-green)] uppercase underline">
                    Visit Brewer Site
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            <div className="bg-white border-2 border-black p-6 md:p-7 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 items-center">
              <div className="space-y-3">
                <p className="text-black leading-relaxed text-lg font-medium">
                  {detail.description || "A mysterious brew with no known history. You'll have to taste it to find out."}
                </p>
                {catalogDetailLoading && (
                  <p className="text-xs text-gray-400 uppercase font-bold">Loading brewery info...</p>
                )}
                {/* Only show a notice if we expected catalog data (catalog IDs) and it failed */}
                {!catalogDetailLoading && !catalogDetail && selectedBeer?.id.startsWith('catalog-') && (
                  <div className="text-xs text-gray-400 uppercase font-bold">Catalog details not available right now.</div>
                )}
                {detail.locations && detail.locations.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Where to find</h4>
                    <div className="flex flex-wrap gap-2">
                      {detail.locations.slice(0, 4).map(loc => (
                        <span key={loc.id} className="px-3 py-1 bg-gray-100 text-black text-xs font-bold border border-black uppercase">
                          {loc.name}{loc.city ? ` • ${loc.city}` : ''}{loc.state ? `, ${loc.state}` : ''}{loc.country ? ` • ${loc.country}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-5 border-2 border-black">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rounds Survived</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-black">{count}</span>
                    <span className="text-sm text-gray-500 font-bold mb-1.5 uppercase">pints tracked</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-bold uppercase">
                    {count === 0 ? "You haven't logged this one yet." :
                      count === 1 ? "Just the first taste." :
                        "You're becoming a regular."}
                  </p>
                </div>

                <FunkyButton
                  onClick={() => handleAddBeerLog(selectedBeer)}
                  className="w-full py-4 text-lg"
                  pulseOnClick
                  pulseDurationMs={750}
                  pressText={<span className="flex items-center gap-2">🎉 <span className="font-bold">Chugged!</span></span>}
                >
                  <span className="flex items-center gap-2">Pour One <ArrowRight size={20} /></span>
                </FunkyButton>
              </div>
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
            <User className="w-6 h-6 text-gray-500" /> My Tab
          </h2>
          {user ? (
            <button onClick={handleLogout} className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <button onClick={() => setIsGuest(false)} className="text-sm text-gray-600 font-bold flex items-center gap-1 hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors">
              Sign In to Cloud
            </button>
          )}
        </div>

        <div className="bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-center">
          <div className="w-24 h-24 bg-black text-[var(--color-neon-green)] mx-auto mb-6 flex items-center justify-center text-4xl border-2 border-[var(--color-neon-green)] overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt="User" /> : '😎'}
          </div>
          <h3 className="text-2xl font-black text-black uppercase">{user?.displayName || 'Master Brewer'}</h3>
          <p className="text-gray-500 mb-8 font-bold">{user ? user.email : 'Level 1 Cicerone in training (Guest)'}</p>

          <div className="grid grid-cols-3 gap-4 text-center divide-x-2 divide-black">
            <div>
              <div className="text-3xl font-black text-black">{logs.length}</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Pints</div>
            </div>
            <div>
              <div className="text-3xl font-black text-black">{new Set(logs.map(l => l.beerId)).size}</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Unique</div>
            </div>
            <div>
              <div className="text-3xl font-black text-black">{Math.floor(logs.length * 0.33)}L</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Volume</div>
            </div>
          </div>
        </div>

        {!user && (
          <div className="bg-gray-50 p-6 text-center border-2 border-black">
            <p className="text-black font-bold mb-2 uppercase">💾 Data stored on this device only.</p>
            <p className="text-gray-600 text-sm mb-4">Sign in to sync your stats across all your devices.</p>
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
            <span className="bg-gray-600 text-white p-1.5 rounded-lg"><BeerIcon size={20} /></span> ChugLog
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
          <span className="text-gray-600"><BeerIcon size={20} /></span> ChugLog
        </div>
        <div className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black px-6 py-1 pb-safe flex justify-between items-end z-50">
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
