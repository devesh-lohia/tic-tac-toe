import React from 'react';

interface LoginViewProps {
    username: string;
    setUsername: (val: string) => void;
    onLogin: () => void;
    loading: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ username, setUsername, onLogin, loading }) => {
    return (
        <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-10">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-[2rem] mx-auto shadow-2xl shadow-purple-500/20 flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500">
                        <span className="text-5xl">⚔️</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter text-white">Tic-Tac-Toe</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Authoritative Arena</p>
                    </div>
                </div>

                <div className="bg-[#16161e] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Player Username</label>
                            <input
                                type="text"
                                placeholder="ENTER NAME"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                className="w-full bg-[#0d0d12] border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-black tracking-widest"
                            />
                        </div>

                        <button
                            onClick={onLogin}
                            disabled={!username || loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-800 disabled:to-gray-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-500/10 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? "Initializing..." : "Enter Arena"}
                        </button>
                    </div>
                    
                    <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                        Multiplayer • Real-time • Authoritative
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
