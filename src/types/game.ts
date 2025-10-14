export type PieceColor = 'black' | 'white' | null;
export type PieceType = 'normal' | 'king';

export interface Piece {
  color: PieceColor;
  type: PieceType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position[];
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  selectedPiece: Position | null;
  validMoves: Position[];
  gameOver: boolean;
  winner: PieceColor;
  mustCapture: boolean;
  captureSequence: Position[];
}

export interface Room {
  id: string;
  room_code: string;
  player1_id: string | null;
  player2_id: string | null;
  current_turn: 'black' | 'white';
  game_state: any;
  winner: string | null;
  status: 'waiting' | 'active' | 'finished';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_code: string;
  player_name: string;
  message: string;
  is_system: boolean;
  created_at: string;
}
