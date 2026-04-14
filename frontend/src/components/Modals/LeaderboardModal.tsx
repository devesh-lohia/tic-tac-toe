import React from 'react';

interface LeaderboardRecord {
    owner_id: string;
    username: string;
    score: number;
    rank: number;
    metadata: any; 
}

interface LeaderboardModalProps {
    records: LeaderboardRecord[];
    onClose: () => void;
    loading: boolean;
}

/** Utility to extract the human-readable part of the username (e.g. "A.uuid" -> "A") */
const cleanUsername = (name: string): string => {
    if (!name) return 'Guest';
    
    // Most our usernames are "name.id"
    // We split by the first dot and take the name part.
    return name.split('.')[0];
};

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ records, onClose, loading }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000]/85 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-[#16161e] border border-gray-800 w-full max-w-2xl h-[80vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full -ml-32 -mb-32 blur-[100px]"></div>

                {/* Header */}
                <div className="p-10 pb-6 flex justify-between items-start relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-2">
                            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em]">🏆 Global Rankings</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight">Hall of Fame</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Top competitive players</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-2xl transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar relative z-10">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fetching Champions...</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                            <span className="text-4xl opacity-20">🏜️</span>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No records found yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {records.map((r, i) => {
                                const metadata = r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {};
                                
                                // Prioritize metadata username (snapshot), then root username
                                // Both might be in "name.uuid" format, so we clean them
                                const displayName = cleanUsername(metadata.username || r.username);
                                
                                const isTop3 = i < 3;
                                const rankColors = [
                                    'from-yellow-400 to-amber-600', // Gold
                                    'from-gray-300 to-gray-500',    // Silver
                                    'from-orange-400 to-orange-700' // Bronze
                                ];

                                return (
                                    <div 
                                        key={r.owner_id} 
                                        className={`group bg-[#0d0d12]/50 border border-gray-800/50 hover:border-gray-700 rounded-3xl p-6 flex items-center gap-6 transition-all hover:translate-x-1 ${isTop3 ? 'bg-gradient-to-r from-white/[0.03] to-transparent' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg ${isTop3 ? `bg-gradient-to-br ${rankColors[i]} text-white` : 'bg-gray-800 text-gray-500'}`}>
                                            {r.rank}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-white tracking-tight">{displayName}</h4>
                                            <div className="flex gap-3 mt-1">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">W: {metadata.wins || 0}</span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">L: {metadata.losses || 0}</span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">D: {metadata.draws || 0}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-black bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
                                                {r.score}
                                            </p>
                                            <p className="text-[8px] text-purple-500 font-black uppercase tracking-widest">Points</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="p-6 bg-[#0d0d12]/40 border-t border-gray-800/50 text-center relative z-10">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">Champions never rest. Keep fighting.</p>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
