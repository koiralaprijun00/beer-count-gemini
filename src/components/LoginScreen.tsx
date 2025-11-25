import React, { useState } from 'react';
import { FunkyButton, FunkyCard, FunkyInput, FunkyBadge } from '../../components/FunkyComponents';
import { Beer as BeerIcon, Sparkles, Trophy } from 'lucide-react';
import {
  signInWithGoogle,
  sendMagicLink,
  completeMagicLinkSignIn,
  signInWithEmail,
  signUpWithEmail
} from '../../services/firebase';

interface LoginScreenProps {
  onLogin: () => void;
  onGuest: () => void;
  authMode: 'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify';
  setAuthMode: (mode: 'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (pass: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onGuest,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword
}) => {
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [error, setError] = useState('');

  const getErrorMessage = (errorObj: any): string => {
    const errorCode = errorObj?.code || errorObj?.message || '';
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
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b-2 border-black mb-8">
        <div className="flex items-center gap-2 font-black text-xl text-black uppercase tracking-tighter">
          <span className="bg-[var(--color-neon-green)] text-black p-1.5 border-2 border-black"><BeerIcon size={20} /></span> ChugLog
        </div>
        <div className="hidden md:flex gap-6 text-sm font-bold text-slate-500">
          <a href="#" className="hover:text-gray-600">Features</a>
          <a href="#" className="hover:text-gray-600">About</a>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pb-12">
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
                <FunkyButton
                  onClick={handleGoogle}
                  isLoading={loadingState === 'google'}
                  className="bg-black text-[var(--color-neon-green)] hover:text-[var(--color-neon-green)] border-black hover:bg-gray-900 shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]"
                >
                  <span className="w-5 h-5 bg-[var(--color-neon-green)] text-black mr-2 inline-flex items-center justify-center border border-black">
                    <span className="font-bold text-xs">G</span>
                  </span>
                  Sign in with Google
                </FunkyButton>

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
                  if (!email) return setError('Email is required');
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
                  if (!email) return setError('Email is required');
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
                    if (!email || !password) return setError('Email and password required');
                    setLoadingState('email-signin'); setError('');
                    try { await signInWithEmail(email, password); onLogin(); }
                    catch (e: any) { setError(getErrorMessage(e)); setLoadingState(null); }
                  }} isLoading={loadingState === 'email-signin'}>
                    Sign In
                  </FunkyButton>
                  <FunkyButton variant="secondary" onClick={async () => {
                    if (!email || !password) return setError('Email and password required');
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

                <FunkyButton
                  onClick={handleGoogle}
                  isLoading={loadingState === 'google'}
                  className="bg-black text-[var(--color-neon-green)] hover:text-[var(--color-neon-green)] hover:bg-gray-900 shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]"
                >
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

        <div className="relative hidden lg:block h-[600px] border-l-2 border-black pl-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--color-neon-green)] opacity-20 blur-[100px]"></div>

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
};

export default LoginScreen;
