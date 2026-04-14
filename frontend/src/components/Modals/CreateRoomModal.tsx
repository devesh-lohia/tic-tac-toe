import React from 'react';

interface CreateRoomModalProps {
    customVisibility: 'public' | 'private';
    setCustomVisibility: (val: 'public' | 'private') => void;
    customMode: 'timed' | 'classic';
    setCustomMode: (val: 'timed' | 'classic') => void;
    onClose: () => void;
    onCreate: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    customVisibility,
    setCustomVisibility,
    customMode,
    setCustomMode,
    onClose,
    onCreate
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[#16161e] border border-gray-800 w-full max-w-sm rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-white">Custom Match</h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Configure your game room</p>
                </div>

                <div className="space-y-6">
                    {/* Visibility Toggle */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Visibility</label>
                        <div className="flex p-1 bg-[#0d0d12] border border-gray-800 rounded-xl">
                            <button
                                onClick={() => setCustomVisibility('public')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${customVisibility === 'public' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                            >
                                Public
                            </button>
                            <button
                                onClick={() => setCustomVisibility('private')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${customVisibility === 'private' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                            >
                                Private
                            </button>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mode</label>
                        <div className="flex p-1 bg-[#0d0d12] border border-gray-800 rounded-xl">
                            <button
                                onClick={() => setCustomMode('timed')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${customMode === 'timed' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                            >
                                Timed
                            </button>
                            <button
                                onClick={() => setCustomMode('classic')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${customMode === 'classic' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                            >
                                Classic
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-800 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onCreate}
                            className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95"
                        >
                            Launch Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;
