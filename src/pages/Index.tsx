import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoomSetup from '@/components/RoomSetup';
import GameBoard from '@/components/GameBoard';
import ChatPanel from '@/components/ChatPanel';
import GameStatus from '@/components/GameStatus';
import WinnerModal from '@/components/WinnerModal';
import { GameState, Position, PieceColor } from '@/types/game';
import {
  createInitialGameState,
  getValidMoves,
  getAllCaptures,
  makeMove,
  checkWinner,
  hasMoreCaptures
} from '@/utils/checkersLogic';

const Index = () => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const { toast } = useToast();

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel('game-room')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const room = payload.new;
            if (room.game_state) {
              setGameState(room.game_state);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const handleRoomReady = (code: string, number: 1 | 2, name: string) => {
    setRoomCode(code);
    setPlayerNumber(number);
    setPlayerName(name);
  };

  const playerColor: PieceColor = playerNumber === 1 ? 'black' : 'white';
  const isYourTurn = gameState.currentTurn === playerColor;

  const handleSquareClick = async (position: Position) => {
    if (!isYourTurn || gameState.gameOver) return;

    const piece = gameState.board[position.row][position.col];

    // If a piece is selected
    if (gameState.selectedPiece) {
      // Check if clicked on a valid move
      const isValidMove = gameState.validMoves.some(
        move => move.row === position.row && move.col === position.col
      );

      if (isValidMove) {
        // Make the move
        const { newBoard, captured } = makeMove(
          gameState.board,
          gameState.selectedPiece,
          position
        );

        // Check if there are more captures available
        const canCaptureMore = captured.length > 0 && hasMoreCaptures(newBoard, position, playerColor);

        let nextTurn = gameState.currentTurn;
        let selectedPiece = null;
        let validMoves: Position[] = [];

        if (canCaptureMore) {
          // Continue capturing
          const { moves, captures } = getValidMoves(newBoard, position, playerColor);
          selectedPiece = position;
          validMoves = captures.map(c => c.to);
        } else {
          // Switch turn
          nextTurn = gameState.currentTurn === 'black' ? 'white' : 'black';
        }

        const winner = checkWinner(newBoard, nextTurn);
        const newGameState: GameState = {
          board: newBoard,
          currentTurn: nextTurn,
          selectedPiece,
          validMoves,
          gameOver: !!winner,
          winner,
          mustCapture: false,
          captureSequence: []
        };

        setGameState(newGameState);

        // Update database
        await supabase
          .from('rooms')
          .update({
            game_state: newGameState as any,
            current_turn: nextTurn,
            winner: winner
          })
          .eq('room_code', roomCode);

        // Record move
        await supabase.from('game_moves').insert({
          room_code: roomCode,
          move_data: { from: gameState.selectedPiece, to: position, captured } as any,
          player: playerColor
        });

        if (winner) {
          toast({
            title: winner === playerColor ? 'You Won!' : 'Game Over',
            description: winner === playerColor ? 'Congratulations!' : `${winner} wins!`
          });
        }
      } else {
        // Deselect or select new piece
        if (piece && piece.color === playerColor) {
          selectPiece(position);
        } else {
          setGameState(prev => ({
            ...prev,
            selectedPiece: null,
            validMoves: []
          }));
        }
      }
    } else {
      // Select a piece
      if (piece && piece.color === playerColor) {
        selectPiece(position);
      }
    }
  };

  const selectPiece = (position: Position) => {
    const allCaptures = getAllCaptures(gameState.board, playerColor);
    const { moves, captures } = getValidMoves(gameState.board, position, playerColor);

    // If there are captures available, only allow capturing moves
    const validMoves = allCaptures.length > 0
      ? captures.map(c => c.to)
      : moves;

    setGameState(prev => ({
      ...prev,
      selectedPiece: position,
      validMoves,
      mustCapture: allCaptures.length > 0
    }));
  };

  const handlePlayAgain = () => {
    const newGameState = createInitialGameState();
    setGameState(newGameState);
    
    supabase
      .from('rooms')
      .update({
        game_state: newGameState as any,
        current_turn: 'black',
        winner: null,
        status: 'active'
      })
      .eq('room_code', roomCode);
  };

  if (!roomCode || !playerNumber) {
    return <RoomSetup onRoomReady={handleRoomReady} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mb-4">
          <GameStatus
            currentTurn={gameState.currentTurn}
            playerColor={playerColor}
            isYourTurn={isYourTurn}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex justify-center">
            <GameBoard
              gameState={gameState}
              onSquareClick={handleSquareClick}
              playerColor={playerColor}
            />
          </div>
          
          <div className="h-[600px]">
            <ChatPanel roomCode={roomCode} playerName={playerName} />
          </div>
        </div>
      </motion.div>

      {gameState.gameOver && gameState.winner && (
        <WinnerModal
          winner={gameState.winner}
          playerColor={playerColor}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

export default Index;
