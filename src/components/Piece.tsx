import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Piece as PieceType } from '@/types/game';

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
}

const Piece = ({ piece, isSelected, isValidMove, onClick }: PieceProps) => {
  return (
    <motion.div
      className={`
        w-14 h-14 rounded-full cursor-pointer relative
        flex items-center justify-center
        shadow-lg transition-all
        ${piece.color === 'black' ? 'bg-piece-black' : 'bg-piece-white'}
        ${isSelected ? 'ring-4 ring-highlight-selected' : ''}
        ${isValidMove ? 'ring-2 ring-highlight-valid' : ''}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? {
        y: [0, -5, 0],
        transition: { duration: 0.5, repeat: Infinity }
      } : {}}
      style={{
        background: piece.color === 'black' 
          ? 'radial-gradient(circle at 30% 30%, hsl(var(--piece-black)), #000)'
          : 'radial-gradient(circle at 30% 30%, #fff, hsl(var(--piece-white)))'
      }}
    >
      {piece.type === 'king' && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Crown 
            className={`w-6 h-6 ${piece.color === 'black' ? 'text-yellow-400' : 'text-yellow-600'}`}
            strokeWidth={2.5}
          />
        </motion.div>
      )}
      {piece.type === 'king' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 10px rgba(255, 215, 0, 0.5)',
              '0 0 20px rgba(255, 215, 0, 0.8)',
              '0 0 10px rgba(255, 215, 0, 0.5)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default Piece;
