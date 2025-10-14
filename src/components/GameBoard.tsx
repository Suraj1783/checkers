import { motion } from 'framer-motion';
import { Position, GameState, PieceColor } from '@/types/game';
import Piece from './Piece';

interface GameBoardProps {
  gameState: GameState;
  onSquareClick: (position: Position) => void;
  playerColor: PieceColor;
}

const GameBoard = ({ gameState, onSquareClick, playerColor }: GameBoardProps) => {
  const { board, selectedPiece, validMoves } = gameState;
  const shouldRotate = playerColor === 'white';

  const isValidMove = (row: number, col: number): boolean => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isSelected = (row: number, col: number): boolean => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  const renderBoard = () => {
    const rows = [];
    const size = board.length;

    for (let row = 0; row < size; row++) {
      const cols = [];
      for (let col = 0; col < size; col++) {
        const actualRow = shouldRotate ? size - 1 - row : row;
        const actualCol = shouldRotate ? size - 1 - col : col;
        const piece = board[actualRow][actualCol];
        const isDark = (actualRow + actualCol) % 2 === 1;

        cols.push(
          <motion.div
            key={`${actualRow}-${actualCol}`}
            className={`
              aspect-square flex items-center justify-center relative
              ${isDark ? 'bg-board-dark' : 'bg-board-light'}
              ${isValidMove(actualRow, actualCol) ? 'bg-highlight-valid/30' : ''}
              ${isSelected(actualRow, actualCol) ? 'ring-2 ring-inset ring-highlight-selected' : ''}
            `}
            onClick={() => onSquareClick({ row: actualRow, col: actualCol })}
            whileHover={isDark ? { scale: 0.98 } : {}}
            transition={{ duration: 0.2 }}
          >
            {isValidMove(actualRow, actualCol) && !piece && (
              <motion.div
                className="w-4 h-4 rounded-full bg-highlight-valid"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            )}
            {piece && (
              <Piece
                piece={piece}
                isSelected={isSelected(actualRow, actualCol)}
                isValidMove={isValidMove(actualRow, actualCol)}
                onClick={() => onSquareClick({ row: actualRow, col: actualCol })}
              />
            )}
          </motion.div>
        );
      }
      rows.push(
        <div key={row} className="grid grid-cols-8 w-full">
          {cols}
        </div>
      );
    }
    return rows;
  };

  return (
    <motion.div
      className="w-full max-w-2xl aspect-square border-4 border-border rounded-lg overflow-hidden shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {renderBoard()}
    </motion.div>
  );
};

export default GameBoard;
