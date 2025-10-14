import { motion } from 'framer-motion';
import { Crown, Clock } from 'lucide-react';
import { PieceColor } from '@/types/game';

interface GameStatusProps {
  currentTurn: PieceColor;
  playerColor: PieceColor;
  isYourTurn: boolean;
}

const GameStatus = ({ currentTurn, playerColor, isYourTurn }: GameStatusProps) => {
  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full ${
            playerColor === 'black' ? 'bg-piece-black' : 'bg-piece-white'
          }`}
        />
        <div>
          <div className="text-sm text-muted-foreground">You are</div>
          <div className="font-semibold text-foreground capitalize">{playerColor}</div>
        </div>
      </div>

      <motion.div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isYourTurn ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
        animate={isYourTurn ? {
          scale: [1, 1.05, 1],
          transition: { duration: 1, repeat: Infinity }
        } : {}}
      >
        {isYourTurn ? (
          <>
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Your Turn</span>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Opponent's Turn</span>
          </>
        )}
      </motion.div>

      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm text-muted-foreground text-right">Current Turn</div>
          <div className="font-semibold text-foreground capitalize text-right">{currentTurn}</div>
        </div>
        <div
          className={`w-8 h-8 rounded-full ${
            currentTurn === 'black' ? 'bg-piece-black' : 'bg-piece-white'
          }`}
        />
      </div>
    </motion.div>
  );
};

export default GameStatus;
