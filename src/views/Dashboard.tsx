import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton, FunkyCard, FunkyBadge } from '../../components/FunkyComponents';
import { History, GlassWater, Trophy, Sparkles } from 'lucide-react';
import {
  calculateStreak,
  hasConsecutiveDayLogging,
  hasConsecutiveWeeks,
  hasWeekdayStreak,
  getUniqueStyles,
  countLogsByPredicate,
  uniqueCountries,
  hasBreweryBestie,
  hasFastFlight,
  countBucket,
  ensureTimeBucket
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

  const resolvedLogs = logs
    .filter(log => beerMap.has(log.beerId))
    .map(log => ensureTimeBucket(log));
  const totalCount = resolvedLogs.length;
  const uniqueCount = new Set(resolvedLogs.map(l => l.beerId)).size;
  const streak = React.useMemo(() => calculateStreak(resolvedLogs), [resolvedLogs]);

  const morningCount = countBucket(resolvedLogs, 'morning');
  const afternoonCount = countBucket(resolvedLogs, 'afternoon');
  const eveningCount = countBucket(resolvedLogs, 'evening');
  const nightOwlCount = countBucket(resolvedLogs, 'latenight');
  const marathonHours = new Set(resolvedLogs.map(log => new Date(log.timestamp).getHours())).size;
  const weekdayOnly14 = hasWeekdayStreak(resolvedLogs, 14);
  const stylesCount = getUniqueStyles(resolvedLogs, myBeers);
  const sourCount = countLogsByPredicate(resolvedLogs, myBeers, beer => beer.type?.toLowerCase().includes('sour') || false);
  const ipaCount = countLogsByPredicate(resolvedLogs, myBeers, beer => beer.type?.toLowerCase().includes('ipa') || false);
  const darkCount = countLogsByPredicate(resolvedLogs, myBeers, beer => {
    const type = beer.type?.toLowerCase() || '';
    return type.includes('stout') || type.includes('porter');
  });
  const crispCount = countLogsByPredicate(resolvedLogs, myBeers, beer => {
    const type = beer.type?.toLowerCase() || '';
    return type.includes('lager') || type.includes('pilsner');
  });
  const barrelCount = countLogsByPredicate(resolvedLogs, myBeers, beer => {
    const type = beer.type?.toLowerCase() || '';
    return type.includes('barrel') || type.includes('aged');
  });
  const fruitCount = countLogsByPredicate(resolvedLogs, myBeers, beer => {
    const type = beer.type?.toLowerCase() || '';
    const name = beer.name?.toLowerCase() || '';
    return type.includes('fruit') || name.includes('fruited') || name.includes('fruit');
  });
  const countryCount = uniqueCountries(resolvedLogs, myBeers);
  const breweryBestie = hasBreweryBestie(resolvedLogs, myBeers, 5);
  const fastFlight = hasFastFlight(resolvedLogs);

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

  const [showCompletedOnly, setShowCompletedOnly] = React.useState(false);

  const achievements = React.useMemo(() => ([
    { name: 'Early Sipper', unlocked: morningCount >= 3, progress: `${morningCount}/3 in the morning (06:00–10:59)` },
    { name: 'Afternoon Adventurer', unlocked: afternoonCount >= 5, progress: `${afternoonCount}/5 in the afternoon (12:00–15:59)` },
    { name: 'Evening Enjoyer', unlocked: eveningCount >= 10, progress: `${eveningCount}/10 in the evening (16:00–23:59)` },
    { name: 'Night Owl', unlocked: nightOwlCount >= 5, progress: `${nightOwlCount}/5 in late night (00:00–05:59)` },
    { name: 'Back-to-Back Banger', unlocked: hasConsecutiveDayLogging(resolvedLogs, 2), progress: '2-day streak' },
    { name: 'Streak Lord', unlocked: streak >= 7, progress: `${streak}/7 day streak` },
    { name: 'Weekly Warrior', unlocked: hasConsecutiveWeeks(resolvedLogs, 4), progress: '4 weeks in a row' },
    { name: 'Marathon Drinker', unlocked: marathonHours >= 12, progress: `${marathonHours}/12 hours logged` },
    { name: 'The Weekend Doesn’t Exist', unlocked: weekdayOnly14, progress: '14 weekday-only streak' },
    { name: 'World Styles Explorer', unlocked: stylesCount >= 10, progress: `${stylesCount}/10 styles` },
    { name: 'Sour Power', unlocked: sourCount >= 5, progress: `${sourCount}/5 sours` },
    { name: 'Hop Head', unlocked: ipaCount >= 10, progress: `${ipaCount}/10 IPAs` },
    { name: 'Crisp King', unlocked: crispCount >= 10, progress: `${crispCount}/10 lagers or pilsners` },
    { name: 'Barrel Barbarian', unlocked: barrelCount >= 3, progress: `${barrelCount}/3 barrel-aged` },
    { name: 'Fruit Freak', unlocked: fruitCount >= 5, progress: `${fruitCount}/5 fruited beers` },
    { name: 'Dark Side', unlocked: darkCount >= 12, progress: `${darkCount}/12 stouts/porters` },
    { name: 'Funky Five-Minute Flight', unlocked: fastFlight, progress: fastFlight ? 'Unlocked' : 'Log 5 different beers in 5 minutes' },
    { name: 'The Globetrotter', unlocked: countryCount >= 10, progress: `${countryCount}/10 countries` },
    { name: 'Brewery Bestie', unlocked: breweryBestie, progress: breweryBestie ? '5+ from one brewery' : 'Log 5 unique from one brewery' },
    { name: 'Boss of the Barley', unlocked: totalCount >= 500, progress: `${totalCount}/500 total` },
  ]), [
    morningCount,
    afternoonCount,
    eveningCount,
    nightOwlCount,
    resolvedLogs,
    streak,
    marathonHours,
    weekdayOnly14,
    stylesCount,
    sourCount,
    ipaCount,
    crispCount,
    barrelCount,
    fruitCount,
    darkCount,
    fastFlight,
    countryCount,
    breweryBestie,
    totalCount
  ]);
  const completedAchievements = achievements.filter(a => a.unlocked).length;
  const visibleAchievements = showCompletedOnly ? achievements.filter(a => a.unlocked) : achievements;

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-black flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[var(--color-neon-green)]" /> Hall of Foam
              </h3>
              <div className="flex items-center gap-3 text-[12px] font-black uppercase text-slate-600">
                <button
                  type="button"
                  onClick={() => setShowCompletedOnly(true)}
                  className="hover:text-black transition-colors border-b-2 border-transparent pb-0.5 hover:border-black"
                  aria-pressed={showCompletedOnly}
                >
                  Completed: <span className="text-black">{completedAchievements}</span>/<span className="text-slate-500">{achievements.length}</span>
                </button>
                {showCompletedOnly && (
                  <button
                    type="button"
                    onClick={() => setShowCompletedOnly(false)}
                    className="transition-colors border-b-2 border-transparent pb-0.5 text-black hover:border-black"
                  >
                    See All
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {visibleAchievements.map(item => {
                const unlocked = item.unlocked;
                const baseClasses = unlocked
                  ? 'bg-black border-black text-[var(--color-neon-green)]'
                  : 'bg-gray-50 border-gray-200 text-slate-600';
                return (
                  <div
                    key={item.name}
                    className={`p-3 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${baseClasses}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black uppercase tracking-wider">{item.name}</div>
                        <div className={`text-[11px] font-bold ${unlocked ? 'text-white' : 'text-slate-500'}`}>{item.progress}</div>
                      </div>
                      <div className="text-lg">{unlocked ? '✅' : '🔒'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
