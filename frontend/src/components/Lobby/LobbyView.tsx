import React, { useState } from 'react';
import MatchItem from './MatchItem';

interface LobbyViewProps {
    username: string;
    matches: any[];
    onRefresh: () => void;
    onJoinByCode: () => void;
    onShowCreate: () => void;
    onJoinMatch: (id: string) => void;
    onFindOpponent: (mode: 'timed' | 'classic') => void;
    onCancelMatchmaking: () => void;
    onShowLeaderboard: () => void;
    isQueued: boolean;
    onSignOut: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({
    username,
    matches,
    onRefresh,
    onJoinByCode,
    onShowCreate,
    onJoinMatch,
    onFindOpponent,
    onCancelMatchmaking,
    onShowLeaderboard,
    isQueued,
    onSignOut
}) => {
    const [selectedMode, setSelectedMode] = useState<'timed' | 'classic'>('timed');

    return (
        <div className="min-h-screen bg-[#0d0d12] text-white p-6 md:p-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* SIDEBAR: Profile & Search */}
                <div className="space-y-6">
                    <div className="bg-[#16161e] border border-gray-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                        👤
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{username.split('.')[0]}</h2>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Player Profile</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onShowLeaderboard}
                                    className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl transition-all active:scale-95 border border-yellow-500/20 text-[9px] font-black uppercase tracking-widest"
                                    title="View Leaderboard"
                                >
                                    Leaderboard
                                </button>
                            </div>
                            
                            {!isQueued ? (
                                <div className="space-y-4">
                                    {/* Mode Selector */}
                                    <div className="space-y-2">
                                        <div className="flex p-1 bg-[#0d0d12] border border-gray-800 rounded-xl">
                                            <button
                                                onClick={() => setSelectedMode('timed')}
                                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${selectedMode === 'timed' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                Timed
                                            </button>
                                            <button
                                                onClick={() => setSelectedMode('classic')}
                                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${selectedMode === 'classic' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                Classic
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onFindOpponent(selectedMode)}
                                        className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02] active:scale-95 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-purple-500/20 uppercase tracking-[0.2em]"
                                    >
                                        Find Opponent
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-[#0d0d12] border border-blue-900/30 rounded-2xl p-6 text-center space-y-3 animate-pulse">
                                        <div className="flex justify-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                        </div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">Searching for match...</p>
                                    </div>
                                    <button
                                        onClick={onCancelMatchmaking}
                                        className="w-full py-4 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white font-bold text-[10px] rounded-xl transition-all uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onSignOut}
                                className="w-full py-4 text-gray-600 hover:text-red-400 font-bold text-[9px] uppercase tracking-[0.2em] transition-colors border-t border-gray-800/50 mt-2"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-gray-800/50 rounded-3xl p-8 space-y-4">
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Game Rules</h4>
                        <ul className="space-y-3">
                            <li className="text-[11px] text-gray-500 flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">•</span>
                                <span>3x3 Grid. 3 in a row wins.</span>
                            </li>
                            <li className="text-[11px] text-gray-500 flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">•</span>
                                <span>Timed mode: 30s per move.</span>
                            </li>
                            <li className="text-[11px] text-gray-500 flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">•</span>
                                <span>Winner gets 3 Global Points.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* MAIN: Match List */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h3 className="font-black text-white text-3xl tracking-tight">Game Lobby</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Live match discovery</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button 
                                onClick={onJoinByCode}
                                className="px-5 py-3 bg-[#16161e] border border-gray-800 text-white text-[10px] font-black rounded-xl hover:bg-gray-800 transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95"
                            >
                                Join By Code
                            </button>
                            <button 
                                onClick={onShowCreate}
                                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black rounded-xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95"
                            >
                                Create Room
                            </button>
                            <button 
                                onClick={onRefresh}
                                className="p-3 bg-[#16161e] border border-gray-800 text-gray-400 hover:text-purple-400 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 group"
                                title="Refresh Lobby"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <path d="M23 4v6h-6"></path>
                                    <path d="M1 20v-6h6"></path>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {matches.length === 0 ? (
                            <div className="bg-[#16161e]/30 border border-dashed border-gray-800 rounded-3xl p-16 text-center group cursor-default">
                                <div className="w-16 h-16 bg-gray-800/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800/50 transition-all">
                                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">📡</span>
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No active public rooms</p>
                                <p className="text-[9px] text-gray-700 mt-2 font-medium uppercase tracking-tighter">Use custom room ID or Ranked queue</p>
                            </div>
                        ) : (
                            matches.map((m) => (
                                <MatchItem 
                                    key={m.matchId || m.match_id} 
                                    match={m} 
                                    onJoin={onJoinMatch} 
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LobbyView;
