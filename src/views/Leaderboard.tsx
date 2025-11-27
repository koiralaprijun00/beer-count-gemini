import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { fetchLeaderboard } from '../../services/firebase';
import { Trophy, Medal, Crown, BookOpen, X } from 'lucide-react';
import { Skeleton } from '../components/shared/Skeleton';
import { User as FirebaseUser } from 'firebase/auth';

interface LeaderboardProps {
    user: FirebaseUser | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);

    useEffect(() => {
        const loadLeaderboard = async () => {
            const data = await fetchLeaderboard();
            setEntries(data);
            setLoading(false);
        };
        loadLeaderboard();
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
            case 2: return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
            case 3: return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
            default: return <span className="text-xl font-black text-gray-400 w-6 text-center">{rank}</span>;
        }
    };

    return (
        <div className="pb-24 animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black flex items-center gap-2 uppercase">
                    <Trophy className="w-8 h-8 text-[var(--color-neon-green)] fill-black" /> Global Rankings
                </h2>
                <button
                    onClick={() => setShowRules(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wider text-black hover:text-[var(--color-neon-green)] transition-colors"
                >
                    <BookOpen size={16} /> Pub Rules
                </button>
            </div>

            {/* Rules Popup */}
            {showRules && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
                    <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-black uppercase flex items-center gap-2">
                                <BookOpen className="w-6 h-6" /> Pub Rules
                            </h3>
                            <button onClick={() => setShowRules(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="bg-[var(--color-neon-green)]/10 border-2 border-black p-4">
                                <p className="font-black uppercase mb-2">🍺 Game Rules</p>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• <strong>Daily Limit:</strong> Max 15 beers per day</li>
                                    <li>• <strong>Fair Play:</strong> No spam clicking or cheating</li>
                                    <li>• <strong>Leaderboard:</strong> Top 50 brewers ranked by total logs</li>
                                    <li>• <strong>Reset:</strong> Daily limit resets at midnight</li>
                                </ul>
                            </div>

                            <div className="bg-red-50 border-2 border-red-500 p-4">
                                <p className="font-black uppercase mb-2 text-red-600">⚠️ Practice Safe Drinking</p>
                                <p className="text-gray-700 text-xs leading-relaxed">
                                    This is a tracking app for fun. Always drink responsibly, know your limits, never drink and drive, and prioritize your health and safety.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowRules(false)}
                                className="w-full bg-black text-white py-3 font-bold uppercase border-2 border-black hover:bg-[var(--color-neon-green)] hover:text-black transition-colors"
                            >
                                Got It!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="p-4 bg-black text-white border-b-2 border-black flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-sm">Brewer</span>
                    <span className="font-bold uppercase tracking-wider text-sm">Total Pints</span>
                </div>

                {loading ? (
                    <div className="p-4 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="w-12 h-6" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-bold uppercase">
                        No legends yet. Be the first!
                    </div>
                ) : (
                    <div className="divide-y-2 divide-black">
                        {entries.map((entry) => {
                            const isMe = user?.uid === entry.userId;
                            return (
                                <div
                                    key={entry.userId}
                                    className={`flex items-center justify-between p-4 ${isMe ? 'bg-[var(--color-neon-green)]/10' : 'hover:bg-gray-50'} transition-colors`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8">
                                            {getRankIcon(entry.rank || 0)}
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white flex items-center justify-center">
                                            {entry.photoURL ? (
                                                <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">🍺</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-black uppercase text-sm ${isMe ? 'text-black' : 'text-gray-800'}`}>
                                                {entry.displayName} {isMe && '(You)'}
                                            </div>
                                            {isMe && <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">That's you!</div>}
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-black">
                                        {entry.totalLogs}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
