import React from 'react';

interface GameStatusProps {
    matchState: any;
    selfId: string;
    selfMark: string;
}

const GameStatus: React.FC<GameStatusProps> = ({ matchState, selfId, selfMark }) => {
    const opponent = Object.keys(matchState.usernames).find(id => id !== selfId);
    const opponentName = opponent ? matchState.usernames[opponent] : 'Opponent';
    const opponentMark = selfMark === 'X' ? 'O' : 'X';
    const isMyTurn = matchState.turn === selfId;

    const [timeLeft, setTimeLeft] = React.useState<number>(matchState.deadline || 30);

    // Sync local timer when turn changes or deadline is refreshed
    React.useEffect(() => {
        if (matchState.deadline !== undefined) {
            setTimeLeft(matchState.deadline);
        }
    }, [matchState.turn, matchState.deadline]);

    // Ticking logic
    React.useEffect(() => {
        if (matchState.mode !== 'timed' || matchState.winner) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [matchState.mode, matchState.winner, matchState.turn]);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className={`flex items-center gap-4 transition-all duration-300 ${isMyTurn ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                <div className="w-16 h-16 bg-purple-600/20 rounded-3xl flex items-center justify-center text-3xl shadow-xl border-2 border-purple-500/30">⚔️</div>
                <div>
                    <h3 className="text-xl font-black text-white leading-tight">YOU ({selfMark})</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isMyTurn ? 'text-purple-400 animate-pulse' : 'text-gray-600'}`}>
                        {isMyTurn ? 'YOUR TURN' : 'WAITING'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="px-6 py-2 bg-[#16161e] border border-gray-800 rounded-full flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                        {matchState.mode === 'classic' ? 'CLASSIC ARENA' : 'TIMED MATCH'}
                    </span>
                </div>
                {matchState.mode === 'timed' && (
                    <div className="flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-xl border border-red-500/20">
                        <span className="text-red-500 text-xs">⏱️</span>
                        <span className="text-red-500 font-black font-mono text-sm">{timeLeft}s</span>
                    </div>
                )}
            </div>

            <div className={`flex items-center gap-4 transition-all duration-300 ${!isMyTurn ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                <div className="text-right">
                    <h3 className="text-xl font-black text-white leading-tight">{opponentName} ({opponentMark})</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${!isMyTurn ? 'text-blue-400 animate-pulse' : 'text-gray-600'}`}>
                        {!isMyTurn ? 'OPPONENT TURN' : 'WAITING'}
                    </p>
                </div>
                <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center text-3xl shadow-xl border-2 border-blue-500/30">🛡️</div>
            </div>
        </div>
    );
};

export default GameStatus;
