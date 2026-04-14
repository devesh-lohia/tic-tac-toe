interface TicTacToeBoardProps {
  board: (string | null)[];
  onMove: (index: number) => void;
  myUserId: string;
  turn: string | null;
  marks: { [userId: string]: string };
  winner: string | null;
}

export function TicTacToeBoard({ board, onMove, myUserId, turn, marks, winner }: TicTacToeBoardProps) {
  const isMyTurn = turn === myUserId;
  const myMark = marks[myUserId];

  const getWinningLine = () => {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const w of wins) {
      if (board[w[0]] && board[w[0]] === board[w[1]] && board[w[0]] === board[w[2]]) {
        return w;
      }
    }
    return null;
  };

  const winningLine = getWinningLine();

  return (
    <div className="relative group">
      {/* Decorative Board Background */}
      <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-[2rem] blur-2xl opacity-50"></div>
      
      <div className="relative grid grid-cols-3 grid-rows-[repeat(3,1fr)] gap-2 md:gap-4 p-2 md:p-4 bg-gray-900/50 backdrop-blur-md rounded-[2rem] border border-gray-800/50 shadow-2xl w-[min(90vw,500px)] h-[min(90vw,500px)] min-w-[min(90vw,500px)] min-h-[min(90vw,500px)] aspect-square overflow-hidden">
        {board.map((cell, i) => {
          const isWinningCell = winningLine?.includes(i);
          return (
            <button
              key={i}
              disabled={!isMyTurn || !!cell || !!winner}
              onClick={() => onMove(i)}
              className={`
                relative w-full h-full rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-5xl md:text-7xl font-black leading-none transition-all duration-300
                ${!cell && isMyTurn && !winner ? 'hover:bg-purple-500/10 hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
                ${isWinningCell ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-[#0d0d12] border border-gray-800/50 text-white'}
                ${cell === 'X' ? 'text-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]' : cell === 'O' ? 'text-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]' : ''}
              `}
            >
              {/* Individual Cell Glow */}
              {cell && (
                <div className={`absolute inset-0 rounded-2xl opacity-10 blur-sm ${cell === 'X' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
              )}
              
              <span className={`relative z-10 transition-transform duration-300 ${cell ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                {cell}
              </span>

              {!cell && isMyTurn && !winner && (
                <span className="absolute inset-0 flex items-center justify-center text-white/10 opacity-0 hover:opacity-100 transition-opacity">
                  {myMark}
                </span>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
export default TicTacToeBoard;
