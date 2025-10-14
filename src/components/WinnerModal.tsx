import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieceColor } from '@/types/game';

interface WinnerModalProps {
  winner: PieceColor;
  playerColor: PieceColor;
  onPlayAgain: () => void;
}

const WinnerModal = ({ winner, playerColor, onPlayAgain }: WinnerModalProps) => {
  const isWinner = winner === playerColor;

  return (
    <Dialog open={!!winner}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Trophy className={`w-20 h-20 ${isWinner ? 'text-accent' : 'text-muted-foreground'}`} />
          </motion.div>
          <DialogTitle className="text-center text-2xl">
            {isWinner ? '🎉 You Won!' : 'Game Over'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isWinner
              ? 'Congratulations! You defeated your opponent!'
              : `${winner} wins the game. Better luck next time!`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={onPlayAgain} size="lg" className="w-full">
            <RotateCcw className="mr-2 w-5 h-5" />
            Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
