import React, { useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton } from '../../components/FunkyComponents';
import { User, LogOut, Sparkles, History, Zap, Trophy } from 'lucide-react';
import {
    calculateFavoriteStyle,
    calculateMostLoggedBrewery,
    calculateAverageABV,
    calculateStreak,
    ensureTimeBucket,
    countBucket,
    hasConsecutiveDayLogging,
    hasConsecutiveWeeks,
    hasWeekdayStreak,
    getUniqueStyles,
    countLogsByPredicate,
    uniqueCountries,
    hasBreweryBestie,
    hasFastFlight
} from '../utils/calculations';

interface ProfileProps {
    user: FirebaseUser | null;
    logs: LogEntry[];
    myBeers: Beer[];
    handleAddBeerLog: (beer: Beer) => void;
    setView: (view: ViewState) => void;
    setSelectedBeer: (beer: Beer) => void;
    setIsGuest: (isGuest: boolean) => void;
    handleLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({
    user,
    logs,
    myBeers,
    handleAddBeerLog,
    setView,
    setSelectedBeer,
    setIsGuest,
    handleLogout
}) => {
    // Calculate statistics using utility functions
    const favoriteStyle = calculateFavoriteStyle(logs, myBeers);
    const mostLoggedBrewery = calculateMostLoggedBrewery(logs, myBeers);
    const averageABV = calculateAverageABV(logs, myBeers);
    const streak = calculateStreak(logs);

    const beerMap = React.useMemo(() => {
        const map = new Map<string, Beer>();
        myBeers.forEach(beer => map.set(beer.id, beer));
        return map;
    }, [myBeers]);

    const resolvedLogs = logs
        .filter(log => beerMap.has(log.beerId))
        .map(log => ensureTimeBucket(log));

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

    const pints = logs.length;
    const unique = new Set(logs.map(l => l.beerId)).size;
    const volume = Math.floor(logs.length * 0.33);

    const pourLevels = {
        pints: Math.min(pints / 100, 1),
        unique: Math.min(unique / 100, 1),
        volume: Math.min(volume / 100, 1),
    };

    const achievements = React.useMemo(() => ([
        { name: 'Early Sipper', unlocked: morningCount >= 3, progress: `${morningCount}/3 (06:00–10:59)` },
        { name: 'Afternoon Adventurer', unlocked: afternoonCount >= 5, progress: `${afternoonCount}/5 (12:00–15:59)` },
        { name: 'Evening Enjoyer', unlocked: eveningCount >= 10, progress: `${eveningCount}/10 (16:00–23:59)` },
        { name: 'Night Owl', unlocked: nightOwlCount >= 5, progress: `${nightOwlCount}/5 (00:00–05:59)` },
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
        { name: 'Funky Five-Minute Flight', unlocked: fastFlight, progress: fastFlight ? 'Unlocked' : 'Log 5 beers in 5 minutes' },
        { name: 'The Globetrotter', unlocked: countryCount >= 10, progress: `${countryCount}/10 countries` },
        { name: 'Brewery Bestie', unlocked: breweryBestie, progress: breweryBestie ? '5+ from one brewery' : 'Log 5 unique from one brewery' },
        { name: 'Boss of the Barley', unlocked: pints >= 500, progress: `${pints}/500 total` },
    ]), [
        afternoonCount,
        barrelCount,
        breweryBestie,
        countryCount,
        crispCount,
        darkCount,
        eveningCount,
        fastFlight,
        fruitCount,
        hasConsecutiveDayLogging,
        hasConsecutiveWeeks,
        ipaCount,
        marathonHours,
        morningCount,
        nightOwlCount,
        pints,
        resolvedLogs,
        sourCount,
        streak,
        stylesCount,
        weekdayOnly14,
        pints,
        unique,
        volume
    ]);

    const completedAchievements = achievements.filter(a => a.unlocked).length;

    // Recent activity
    const recentActivity = logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(log => ({
            log,
            beer: myBeers.find(b => b.id === log.beerId)
        }))
        .filter(item => item.beer);

    // Recommendations based on favorite style
    const recommendations = myBeers
        .filter(beer =>
            beer.type.toLowerCase().includes(favoriteStyle.toLowerCase()) &&
            !logs.some(log => log.beerId === beer.id)
        )
        .slice(0, 3);

    const sliderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (document.getElementById('profile-anim-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'profile-anim-styles';
        styleEl.innerHTML = `
          @keyframes rise {
            0% { transform: translateY(0) scale(0.7); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-120%) scale(1); opacity: 0; }
          }
        `;
        document.head.appendChild(styleEl);
    }, []);

    return (
        <div className="pb-24 animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black flex items-center gap-2 uppercase">
                    My Tab
                </h2>
                {user ? (
                    <button onClick={handleLogout} className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 transition-colors border-2 border-transparent hover:border-red-500 rounded-md">
                        <LogOut size={16} /> Sign Out
                    </button>
                ) : (
                    <button onClick={() => setIsGuest(false)} className="text-sm text-black font-bold flex items-center gap-1 hover:bg-gray-50 px-3 py-1 transition-colors border-2 border-black rounded-md">
                        Sign In to Cloud
                    </button>
                )}
            </div>

            {/* Hero / Snapshot */}
            <section className="relative overflow-hidden bg-gradient-to-br from-black via-slate-900 to-gray-900 text-white p-6 md:p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(204,255,0,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_35%)]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-[var(--color-neon-green)] bg-black flex items-center justify-center text-3xl overflow-hidden">
                            {user?.photoURL ? <img src={user.photoURL} alt="User" /> : '😎'}
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-gray-300 mb-1">Tab Owner</div>
                            <div className="text-2xl font-black leading-tight">{user?.displayName || 'Master Brewer'}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                        {[
                            { label: 'Pints', value: pints, suffix: '', level: pourLevels.pints },
                            { label: 'Unique', value: unique, suffix: '', level: pourLevels.unique },
                            { label: 'Volume', value: volume, suffix: 'L', level: pourLevels.volume },
                        ].map(tile => (
                            <div
                                key={tile.label}
                                className="relative overflow-hidden bg-white/5 border border-white/20 px-4 py-3 rounded-lg text-center group"
                            >
                                <div
                                    className="absolute inset-0 bg-[var(--color-neon-green)]/15 origin-bottom"
                                    style={{
                                        transform: `scaleY(${tile.level || 0})`,
                                        transition: 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
                                    }}
                                />
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {[...Array(3)].map((_, i) => (
                                        <span
                                            key={i}
                                            className="absolute w-1.5 h-1.5 bg-white/50 rounded-full blur-[1px] opacity-0 group-hover:opacity-80"
                                            style={{
                                                left: `${20 + i * 30}%`,
                                                bottom: '-10%',
                                                animation: `rise 3s ease-in-out ${i * 0.4}s infinite`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="relative z-10">
                                    <div className="text-xs uppercase text-gray-300 tracking-[0.12em]">{tile.label}</div>
                                    <div className="text-2xl font-black">{tile.value}{tile.suffix}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="px-0 py-6">
                <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    Your Stats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border-2 border-black bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Favorite Style</div>
                        <div className="text-lg font-black text-black uppercase">{favoriteStyle}</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Top Brewery</div>
                        <div className="text-sm font-black text-black uppercase truncate">{mostLoggedBrewery}</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Avg ABV</div>
                        <div className="text-lg font-black text-black">{averageABV}%</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Current Streak</div>
                        <div className="text-lg font-black text-black">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="px-0 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-black flex items-center gap-2 text-sm uppercase tracking-wider">
                        Hall of Foam
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-black uppercase text-slate-600">
                            Completed: <span className="text-black">{completedAchievements}</span>/<span className="text-slate-500">{achievements.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => sliderRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                                className="w-8 h-8 border-2 border-black text-black font-black bg-gray-50 hover:bg-black hover:text-[var(--color-neon-green)] transition-colors"
                                aria-label="Scroll left"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={() => sliderRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                                className="w-8 h-8 border-2 border-black text-black font-black bg-gray-50 hover:bg-black hover:text-[var(--color-neon-green)] transition-colors"
                                aria-label="Scroll right"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden mt-2">
                    <div
                        ref={sliderRef}
                        className="flex gap-3 pr-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {achievements.map(item => {
                            const unlocked = item.unlocked;
                            const baseClasses = unlocked
                                ? 'bg-black border-black text-[var(--color-neon-green)]'
                                : 'bg-gray-50 border-black text-slate-600';
                            return (
                                <div
                                    key={item.name}
                                    className={`min-w-[220px] max-w-[220px] p-3 border-2 ${baseClasses} transition-transform hover:scale-95`}
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
            </section>

            {/* Recently Poured */}
            {recentActivity.length > 0 && (
                <section className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-black flex items-center gap-2 text-sm uppercase tracking-wider">
                            <History className="w-4 h-4 text-[var(--color-neon-green)]" /> Recently Poured Beers
                        </h3>
                        <button
                            onClick={() => setView(ViewState.SEARCH)}
                            className="text-xs font-bold uppercase text-gray-600 hover:text-black"
                        >
                            Pour another
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map(({ log, beer }) => (
                            <div key={log.id} className="flex items-center justify-between p-3 border-2 border-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white text-2xl flex items-center justify-center border-2 border-black">
                                        {beer?.emoji || '🍺'}
                                    </div>
                                    <div>
                                        <div className="font-black text-black text-sm uppercase">{beer?.name}</div>
                                        <div className="text-xs text-gray-600 font-bold">{beer?.brewery}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-bold">
                                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => beer && handleAddBeerLog(beer)}
                                        className="text-xs font-bold text-black hover:text-[var(--color-neon-green)] uppercase"
                                    >
                                        Pour Again
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && logs.length > 0 && (
                <section className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-[var(--color-neon-green)]" /> Based on Your Taste
                    </h3>
                    <p className="text-xs text-gray-500 font-bold mb-4">You seem to love {favoriteStyle}. Try these:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendations.map(beer => (
                            <div
                                key={beer.id}
                                onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }}
                                className="p-4 border-2 border-black cursor-pointer bg-gray-50 hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white text-2xl flex items-center justify-center border-2 border-black">
                                        {beer.emoji || '🍺'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-black text-sm uppercase truncate">{beer.name}</div>
                                        <div className="text-xs text-gray-500 font-bold truncate">{beer.brewery}</div>
                                    </div>
                                </div>
                                <FunkyButton
                                    variant="primary"
                                    className="!py-2 !text-xs"
                                    onClick={(e) => { e.stopPropagation(); handleAddBeerLog(beer); }}
                                >
                                    Try This
                                </FunkyButton>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {!user && (
                <div className="bg-gray-50 p-6 text-center border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-black font-bold mb-2 uppercase">💾 Data stored on this device only.</p>
                    <p className="text-gray-600 text-sm mb-4">Sign in to sync your stats across all your devices.</p>
                    <FunkyButton onClick={() => setIsGuest(false)}>Connect Cloud Account</FunkyButton>
                </div>
            )}
        </div>
    );
};

export default Profile;
