import React from 'react';

interface MatchItemProps {
    match: any;
    onJoin: (id: string) => void;
}

const MatchItem: React.FC<MatchItemProps> = ({ match, onJoin }) => {
    const label = JSON.parse(match.label || '{}');
    const matchId = match.matchId || match.match_id;

    return (
        <div 
            key={matchId} 
            className="group relative bg-[#16161e] border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/5 flex items-center justify-between overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 bg-[#0d0d12] rounded-xl flex items-center justify-center border border-gray-800 group-hover:border-purple-500/30 transition-colors">
                    <span className="text-xl">{label.mode === 'timed' ? '⚡' : '👑'}</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm tracking-tight">{label.hostName || 'Arena'}</span>
                        <span className="px-1.5 py-0.5 bg-gray-800 text-[8px] font-black text-gray-500 rounded uppercase tracking-widest leading-none">
                            {label.mode || 'timed'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                            {match.size}/2 Players
                        </span>
                        <span className="text-[9px] text-purple-400/60 font-black tracking-[0.2em]">#{label.code}</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onJoin(matchId)}
                className="relative z-10 px-5 py-2.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest border border-purple-500/20 active:scale-95"
            >
                Join
            </button>
        </div>
    );
};

export default MatchItem;
