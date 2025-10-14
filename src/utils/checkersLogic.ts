import { Piece, Position, GameState, PieceColor, Move } from '@/types/game';

export const BOARD_SIZE = 8;

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  // Place black pieces (top 3 rows)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'black', type: 'normal' };
      }
    }
  }
  
  // Place white pieces (bottom 3 rows)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'white', type: 'normal' };
      }
    }
  }
  
  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'black',
    selectedPiece: null,
    validMoves: [],
    gameOver: false,
    winner: null,
    mustCapture: false,
    captureSequence: []
  };
}

export function getValidMoves(
  board: (Piece | null)[][],
  position: Position,
  playerColor: PieceColor
): { moves: Position[]; captures: Move[] } {
  const piece = board[position.row][position.col];
  if (!piece || piece.color !== playerColor) {
    return { moves: [], captures: [] };
  }

  const moves: Position[] = [];
  const captures: Move[] = [];
  
  const directions = piece.type === 'king'
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === 'black'
    ? [[1, -1], [1, 1]]
    : [[-1, -1], [-1, 1]];

  // Check for captures first
  for (const [dRow, dCol] of directions) {
    const jumpRow = position.row + dRow * 2;
    const jumpCol = position.col + dCol * 2;
    const midRow = position.row + dRow;
    const midCol = position.col + dCol;

    if (
      jumpRow >= 0 && jumpRow < BOARD_SIZE &&
      jumpCol >= 0 && jumpCol < BOARD_SIZE &&
      midRow >= 0 && midRow < BOARD_SIZE &&
      midCol >= 0 && midCol < BOARD_SIZE
    ) {
      const middle = board[midRow][midCol];
      const target = board[jumpRow][jumpCol];

      if (middle && middle.color !== playerColor && !target) {
        captures.push({
          from: position,
          to: { row: jumpRow, col: jumpCol },
          captured: [{ row: midRow, col: midCol }]
        });
      }
    }
  }

  // If no captures, check regular moves
  if (captures.length === 0) {
    for (const [dRow, dCol] of directions) {
      const newRow = position.row + dRow;
      const newCol = position.col + dCol;

      if (
        newRow >= 0 && newRow < BOARD_SIZE &&
        newCol >= 0 && newCol < BOARD_SIZE &&
        !board[newRow][newCol]
      ) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return { moves, captures };
}

export function getAllCaptures(board: (Piece | null)[][], playerColor: PieceColor): Move[] {
  const allCaptures: Move[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        const { captures } = getValidMoves(board, { row, col }, playerColor);
        allCaptures.push(...captures);
      }
    }
  }
  
  return allCaptures;
}

export function makeMove(
  board: (Piece | null)[][],
  from: Position,
  to: Position
): { newBoard: (Piece | null)[][]; captured: Position[] } {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  
  if (!piece) {
    return { newBoard, captured: [] };
  }

  // Move the piece
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // Check for capture
  const captured: Position[] = [];
  const rowDiff = Math.abs(to.row - from.row);
  
  if (rowDiff === 2) {
    const midRow = (from.row + to.row) / 2;
    const midCol = (from.col + to.col) / 2;
    captured.push({ row: midRow, col: midCol });
    newBoard[midRow][midCol] = null;
  }

  // Check for king promotion
  if (
    (piece.color === 'black' && to.row === BOARD_SIZE - 1) ||
    (piece.color === 'white' && to.row === 0)
  ) {
    newBoard[to.row][to.col] = { ...piece, type: 'king' };
  }

  return { newBoard, captured };
}

export function checkWinner(board: (Piece | null)[][], currentTurn: PieceColor): PieceColor {
  let blackCount = 0;
  let whiteCount = 0;
  let blackHasMoves = false;
  let whiteHasMoves = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === 'black') {
          blackCount++;
          const { moves, captures } = getValidMoves(board, { row, col }, 'black');
          if (moves.length > 0 || captures.length > 0) {
            blackHasMoves = true;
          }
        } else {
          whiteCount++;
          const { moves, captures } = getValidMoves(board, { row, col }, 'white');
          if (moves.length > 0 || captures.length > 0) {
            whiteHasMoves = true;
          }
        }
      }
    }
  }

  if (blackCount === 0 || !blackHasMoves) return 'white';
  if (whiteCount === 0 || !whiteHasMoves) return 'black';
  return null;
}

export function hasMoreCaptures(
  board: (Piece | null)[][],
  position: Position,
  playerColor: PieceColor
): boolean {
  const { captures } = getValidMoves(board, position, playerColor);
  return captures.length > 0;
}
