import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Beer, LogEntry, ViewState } from '../../types';
import { FunkyButton } from '../../components/FunkyComponents';
import { User, LogOut, Sparkles, History, Zap } from 'lucide-react';
import {
    calculateFavoriteStyle,
    calculateMostLoggedBrewery,
    calculateAverageABV,
    calculateStreak
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

    return (
        <div className="pb-24 animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black flex items-center gap-2 uppercase">
                    <User className="w-6 h-6" /> My Tab
                </h2>
                {user ? (
                    <button onClick={handleLogout} className="text-sm text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 transition-colors border-2 border-transparent hover:border-red-500">
                        <LogOut size={16} /> Sign Out
                    </button>
                ) : (
                    <button onClick={() => setIsGuest(false)} className="text-sm text-black font-bold flex items-center gap-1 hover:bg-gray-50 px-3 py-1 transition-colors border-2 border-black">
                        Sign In to Cloud
                    </button>
                )}
            </div>

            {/* User Card */}
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

            {/* Statistics Section */}
            <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[var(--color-neon-green)]" /> Your Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border-2 border-black bg-gray-50">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Favorite Style</div>
                        <div className="text-lg font-black text-black uppercase">{favoriteStyle}</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Top Brewery</div>
                        <div className="text-sm font-black text-black uppercase truncate">{mostLoggedBrewery}</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Avg ABV</div>
                        <div className="text-lg font-black text-black">{averageABV}%</div>
                    </div>
                    <div className="p-4 border-2 border-black bg-gray-50">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Current Streak</div>
                        <div className="text-lg font-black text-black">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
                <div className="bg-white border-2 border-black p-6">
                    <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <History className="w-4 h-4 text-[var(--color-neon-green)]" /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {recentActivity.map(({ log, beer }) => (
                            <div key={log.id} className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white text-2xl flex items-center justify-center border-2 border-black">
                                        {beer?.emoji || '🍺'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-black text-sm uppercase">{beer?.name}</div>
                                        <div className="text-xs text-gray-500 font-bold">{beer?.brewery}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 font-bold">
                                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => beer && handleAddBeerLog(beer)}
                                        className="text-xs font-bold text-black hover:text-[var(--color-neon-green)] uppercase"
                                    >
                                        Log Again
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && logs.length > 0 && (
                <div className="bg-white border-2 border-black p-6">
                    <h3 className="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-[var(--color-neon-green)]" /> Based on Your Taste
                    </h3>
                    <p className="text-xs text-gray-500 font-bold mb-4">You seem to love {favoriteStyle}. Try these:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendations.map(beer => (
                            <div
                                key={beer.id}
                                onClick={() => { setSelectedBeer(beer); setView(ViewState.DETAIL); }}
                                className="p-4 border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors"
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
                </div>
            )}

            {!user && (
                <div className="bg-gray-50 p-6 text-center border-2 border-black">
                    <p className="text-black font-bold mb-2 uppercase">💾 Data stored on this device only.</p>
                    <p className="text-gray-600 text-sm mb-4">Sign in to sync your stats across all your devices.</p>
                    <FunkyButton onClick={() => setIsGuest(false)}>Connect Cloud Account</FunkyButton>
                </div>
            )}
        </div>
    );
};

export default Profile;
