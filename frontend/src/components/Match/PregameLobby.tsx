import React from 'react';
import nakama from '../../NakamaManager';

interface PregameLobbyProps {
    match: any;
    matchState: any;
    onReady: () => void;
    onQuit: () => void;
    roomCode: string;
}

const PregameLobby: React.FC<PregameLobbyProps> = ({ match, matchState, onReady, onQuit, roomCode }) => {
    // Determine my own userId from the session
    const myId = nakama.session?.user_id || '';
    
    // Safety check: fall back to first presence if session is missing (rare)
    const selfId = myId || match.presences?.[0]?.user_id || '';
    
    // Match state checks
    const isReady = matchState.readyPlayers?.[selfId] || false;
    
    // Identify opponent
    const opponent = Object.keys(matchState.usernames || {}).find(id => id !== selfId);
    const opponentName = opponent ? matchState.usernames[opponent] : null;
    const opponentReady = opponent ? matchState.readyPlayers?.[opponent] : false;

    // Room Code extraction safety
    const labelData = match?.label ? (typeof match.label === 'string' ? JSON.parse(match.label) : match.label) : {};
    const effectiveRoomCode = roomCode !== '#####' ? roomCode : (labelData.code || '#####');

    return (
        <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent">
            <div className="w-full max-w-xl space-y-10 animate-[slideUp_0.4s_ease-out]">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Match Lobby</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-white tracking-tight">Prepare for Battle</h2>
                        <div className="flex items-center justify-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[11px]">
                            <span>Room Code:</span>
                            <span className="text-white bg-gray-800 px-2 py-0.5 rounded select-all font-mono">
                                {effectiveRoomCode}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-12 h-12 bg-[#0d0d12] border-2 border-gray-800 rounded-full flex items-center justify-center text-xs font-black text-gray-600">VS</div>
                    </div>

                    {[ 
                        { name: (matchState.usernames && matchState.usernames[selfId]) || 'You', ready: isReady, self: true }, 
                        { name: opponentName || 'Waiting...', ready: opponentReady, self: false } 
                    ].map((p, i) => (
                        <div key={i} className={`bg-[#16161e] border-2 rounded-[2.5rem] p-8 space-y-4 transition-all duration-500 ${p.ready ? 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : 'border-gray-800'}`}>
                            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-2xl ${p.self ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                {p.self ? '⚔️' : (opponentName ? '🛡️' : '⌛')}
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-black text-white truncate px-2">{p.name}</p>
                                <div className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.ready ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                    {p.ready ? 'Ready' : 'Not Ready'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onReady}
                        className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${isReady ? 'bg-gray-800 text-gray-500 cursor-default' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/20 hover:scale-[1.02]'}`}
                    >
                        {isReady ? 'Waiting for opponent...' : 'Signify Readiness'}
                    </button>
                    <button
                        onClick={onQuit}
                        className="w-full py-4 text-gray-600 hover:text-red-400 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors"
                    >
                        Quit Matchmaking
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PregameLobby;
