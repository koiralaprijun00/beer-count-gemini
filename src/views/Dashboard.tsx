import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton, FunkyCard, FunkyBadge } from '../../components/FunkyComponents';
import { History, GlassWater, Trophy, Sparkles } from 'lucide-react';
import {
  checkWeekendWarrior,
  checkStyleMaster,
  checkLocalHero
} from '../utils/calculations';

interface DashboardProps {
  user: FirebaseUser | null;
  logs: LogEntry[];
  myBeers: Beer[];
  setView: (view: ViewState) => void;
  setSelectedBeer: (beer: Beer) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  logs,
  myBeers,
  setView,
  setSelectedBeer
}) => {
  const beerMap = React.useMemo(() => {
    const map = new Map<string, Beer>();
    myBeers.forEach(beer => map.set(beer.id, beer));
    return map;
  }, [myBeers]);

  const resolvedLogs = logs.filter(log => beerMap.has(log.beerId));
  const totalCount = resolvedLogs.length;
  const uniqueCount = new Set(resolvedLogs.map(l => l.beerId)).size;

  // Group logs by beer to avoid duplicates in Recent Chugs
  const recentGroupedLogs = (() => {
    const map = new Map<string, { beer: Beer; count: number; latest: number }>();
    resolvedLogs.forEach(log => {
      const beer = beerMap.get(log.beerId);
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

        {/* Right Col: Hall of Foam */}
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
              <div className={`p-3 flex items-center gap-3 border-2 ${totalCount >= 100 ? 'bg-black border-black text-[var(--color-neon-green)]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                <span className="text-xl">{totalCount >= 100 ? '💯' : '🔒'}</span>
                <div className="text-sm font-bold uppercase">Century Club (100)</div>
              </div>
              <div className={`p-3 flex items-center gap-3 border-2 ${uniqueCount >= 25 ? 'bg-white border-black text-black' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                <span className="text-xl">{uniqueCount >= 25 ? '🎯' : '🔒'}</span>
                <div className="text-sm font-bold uppercase">Variety Seeker (25 Unique)</div>
              </div>
              <div className={`p-3 flex items-center gap-3 border-2 ${checkWeekendWarrior(logs) ? 'bg-black border-black text-[var(--color-neon-green)]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                <span className="text-xl">{checkWeekendWarrior(logs) ? '🎉' : '🔒'}</span>
                <div className="text-sm font-bold uppercase">Weekend Warrior (10)</div>
              </div>
              <div className={`p-3 flex items-center gap-3 border-2 ${checkStyleMaster(logs, myBeers) ? 'bg-white border-black text-black' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                <span className="text-xl">{checkStyleMaster(logs, myBeers) ? '🏆' : '🔒'}</span>
                <div className="text-sm font-bold uppercase">Style Master (All Styles)</div>
              </div>
              <div className={`p-3 flex items-center gap-3 border-2 ${checkLocalHero(logs, myBeers) ? 'bg-black border-black text-[var(--color-neon-green)]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                <span className="text-xl">{checkLocalHero(logs, myBeers) ? '🏠' : '🔒'}</span>
                <div className="text-sm font-bold uppercase">Local Hero (5+ Breweries)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
