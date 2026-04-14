import React from 'react';

interface JoinRoomModalProps {
    manualMatchId: string;
    setManualMatchId: (val: string) => void;
    onClose: () => void;
    onJoin: () => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ manualMatchId, setManualMatchId, onClose, onJoin }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[#16161e] border border-gray-800 w-full max-w-sm rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-white">Join Room</h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Enter the 5-digit access code</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Room Code</label>
                        <input
                            type="text"
                            placeholder="00000"
                            value={manualMatchId}
                            maxLength={5}
                            onChange={(e) => setManualMatchId(e.target.value.toUpperCase().replace(/[^0-9]/g, ''))}
                            className="w-full bg-[#0d0d12] border border-gray-800 rounded-2xl px-6 py-5 text-2xl text-center text-white placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-black tracking-[0.5em]"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-800 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onJoin}
                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            Join Match
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinRoomModal;
