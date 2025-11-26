import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { fetchLeaderboard } from '../../services/firebase';
import { Trophy, Medal, Crown } from 'lucide-react';
import { Skeleton } from '../components/shared/Skeleton';
import { User as FirebaseUser } from 'firebase/auth';

interface LeaderboardProps {
    user: FirebaseUser | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

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
            </div>

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
