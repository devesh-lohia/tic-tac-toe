import React from 'react';
import GameStatus from './GameStatus';
import TicTacToeBoard from '../TicTacToeBoard';

interface MatchViewProps {
    matchState: any;
    selfId: string;
    onMove: (index: number) => void;
    onQuit: () => void;
}

const MatchView: React.FC<MatchViewProps> = ({ matchState, selfId, onMove, onQuit }) => {
    const selfMark = matchState.marks[selfId] || 'X';

    return (
        <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
            <div className="w-full max-w-4xl space-y-8 animate-[fadeIn_0.5s_ease-out]">
                
                <GameStatus 
                    matchState={matchState}
                    selfId={selfId}
                    selfMark={selfMark}
                />

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative bg-[#16161e] border border-gray-800 rounded-[3rem] p-4 md:p-8 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        
                        <div className="flex justify-center relative z-10">
                            <TicTacToeBoard
                                board={matchState.board}
                                onMove={onMove}
                                myUserId={selfId}
                                turn={matchState.turn}
                                marks={matchState.marks}
                                winner={matchState.winner}
                            />
                        </div>
                    </div>

                    {/* End Game Overlay */}
                    {matchState.winner && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d0d12]/60 backdrop-blur-md rounded-[3rem] animate-[fadeIn_0.5s_ease-out]">
                            <div className="text-center space-y-8 p-12 bg-[#16161e] border border-gray-800 rounded-[3rem] shadow-2xl scale-110">
                                <div className="space-y-4">
                                    <div className="w-24 h-24 bg-gradient-to-tr from-yellow-500 to-orange-500 rounded-3xl mx-auto flex items-center justify-center text-5xl shadow-2xl animate-bounce">
                                        {matchState.winner === 'draw' ? '🤝' : (matchState.winner === selfId ? '🏆' : '💀')}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black text-white tracking-tighter">
                                            {matchState.winner === 'draw' ? "It's a Draw!" : (matchState.winner === selfId ? "Victory!" : "Defeated")}
                                        </h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                                            {matchState.winner === 'draw' ? "Well matched!" : (matchState.winner === selfId ? "Master of the Arena" : "Better luck next time")}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onQuit}
                                    className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
                                >
                                    Return to Lobby
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-4">
                    <button
                        onClick={onQuit}
                        className="flex items-center gap-3 px-8 py-4 text-gray-600 hover:text-red-400 font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-gray-800/20 rounded-2xl"
                    >
                        <span>🏳️</span> Abandon Match
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchView;
