const boardSurface = document.querySelector("#boardSurface");
const piecesLayer = document.querySelector("#piecesLayer");
const legalLayer = document.querySelector("#legalLayer");
const moveList = document.querySelector("#moveList");
const moveHighlight = document.querySelector("#moveHighlight");

const undoBtn = document.querySelector("#undoBtn");
const resetBtn = document.querySelector("#resetBtn");
const hintBtn = document.querySelector("#hintBtn");
const themeSwitch = document.querySelector("#themeSwitch");

const gameStatePill = document.querySelector("#gameStatePill");
const phaseLabel = document.querySelector("#phaseLabel");
const turnStrip = document.querySelector("#turnStrip");
const playerBlackCard = document.querySelector("#playerBlackCard");
const playerRedCard = document.querySelector("#playerRedCard");

const currentDescription = document.querySelector("#currentDescription");
const engineSuggestion = document.querySelector("#engineSuggestion");
const currentStepEl = document.querySelector("#currentStep");
const turnLabel = document.querySelector("#turnLabel");
const evalChip = document.querySelector("#evalChip");

const inspectorTitle = document.querySelector("#inspectorTitle");
const inspectorBadge = document.querySelector("#inspectorBadge");
const inspectorText = document.querySelector("#inspectorText");

const boardMetrics = {
  padX: 10,
  padY: 8.333333,
  cellX: 10,
  cellY: 9.259259,
};

const initialPieces = [
  { id: "b-rook-left", side: "black", type: "rook", label: "车", x: 0, y: 0 },
  { id: "b-horse-left", side: "black", type: "horse", label: "马", x: 1, y: 0 },
  { id: "b-elephant-left", side: "black", type: "elephant", label: "象", x: 2, y: 0 },
  { id: "b-advisor-left", side: "black", type: "advisor", label: "士", x: 3, y: 0 },
  { id: "b-general", side: "black", type: "general", label: "将", x: 4, y: 0 },
  { id: "b-advisor-right", side: "black", type: "advisor", label: "士", x: 5, y: 0 },
  { id: "b-elephant-right", side: "black", type: "elephant", label: "象", x: 6, y: 0 },
  { id: "b-horse-right", side: "black", type: "horse", label: "马", x: 7, y: 0 },
  { id: "b-rook-right", side: "black", type: "rook", label: "车", x: 8, y: 0 },
  { id: "b-cannon-left", side: "black", type: "cannon", label: "炮", x: 1, y: 2 },
  { id: "b-cannon-right", side: "black", type: "cannon", label: "炮", x: 7, y: 2 },
  { id: "b-soldier-1", side: "black", type: "soldier", label: "卒", x: 0, y: 3 },
  { id: "b-soldier-2", side: "black", type: "soldier", label: "卒", x: 2, y: 3 },
  { id: "b-soldier-3", side: "black", type: "soldier", label: "卒", x: 4, y: 3 },
  { id: "b-soldier-4", side: "black", type: "soldier", label: "卒", x: 6, y: 3 },
  { id: "b-soldier-5", side: "black", type: "soldier", label: "卒", x: 8, y: 3 },

  { id: "r-rook-left", side: "red", type: "rook", label: "车", x: 0, y: 9 },
  { id: "r-horse-left", side: "red", type: "horse", label: "马", x: 1, y: 9 },
  { id: "r-elephant-left", side: "red", type: "elephant", label: "相", x: 2, y: 9 },
  { id: "r-advisor-left", side: "red", type: "advisor", label: "仕", x: 3, y: 9 },
  { id: "r-general", side: "red", type: "general", label: "帅", x: 4, y: 9 },
  { id: "r-advisor-right", side: "red", type: "advisor", label: "仕", x: 5, y: 9 },
  { id: "r-elephant-right", side: "red", type: "elephant", label: "相", x: 6, y: 9 },
  { id: "r-horse-right", side: "red", type: "horse", label: "马", x: 7, y: 9 },
  { id: "r-rook-right", side: "red", type: "rook", label: "车", x: 8, y: 9 },
  { id: "r-cannon-left", side: "red", type: "cannon", label: "炮", x: 1, y: 7 },
  { id: "r-cannon-right", side: "red", type: "cannon", label: "炮", x: 7, y: 7 },
  { id: "r-soldier-1", side: "red", type: "soldier", label: "兵", x: 0, y: 6 },
  { id: "r-soldier-2", side: "red", type: "soldier", label: "兵", x: 2, y: 6 },
  { id: "r-soldier-3", side: "red", type: "soldier", label: "兵", x: 4, y: 6 },
  { id: "r-soldier-4", side: "red", type: "soldier", label: "兵", x: 6, y: 6 },
  { id: "r-soldier-5", side: "red", type: "soldier", label: "兵", x: 8, y: 6 },
];

const pieceProfiles = {
  general: {
    title: "主帅",
    summary: "只能在九宫内直走一格，同时要时刻避免与对方将帅隔空照面。",
  },
  advisor: {
    title: "仕士",
    summary: "在九宫里斜走一格，负责贴身保护将帅和巩固中腹结构。",
  },
  elephant: {
    title: "相象",
    summary: "斜走两格且不能过河，中点若被堵住就会出现典型的塞象眼。",
  },
  horse: {
    title: "马",
    summary: "走日字，先迈一步的马腿若被挡住，就会形成蹩马腿。",
  },
  rook: {
    title: "车",
    summary: "横竖直线通吃整盘，是中国象棋里最直接也最强力的长线子力。",
  },
  cannon: {
    title: "炮",
    summary: "不吃子时和车一样直走，吃子时必须隔着一枚棋子打过去。",
  },
  soldier: {
    title: "兵卒",
    summary: "过河前只能前进，过河后才能横走，是节奏和空间最关键的基础子。",
  },
};

function createInitialGameState() {
  return {
    pieces: clonePieces(initialPieces),
    turn: "red",
    winner: null,
    selectedPieceId: null,
    inspectedPieceId: "r-general",
    legalMoves: [],
    history: [],
    lastMove: null,
    statusText: "红方先行，点击棋子开始对局。",
    hintTarget: null,
    checkSide: null,
  };
}

let gameState = createInitialGameState();

function clonePieces(pieces) {
  return pieces.map((piece) => ({ ...piece }));
}

function getSideLabel(side) {
  return side === "red" ? "红方" : "黑方";
}

function getOppositeSide(side) {
  return side === "red" ? "black" : "red";
}

function createBoardMap(pieces) {
  const map = new Map();

  pieces.forEach((piece) => {
    map.set(`${piece.x},${piece.y}`, piece);
  });

  return map;
}

function getPieceById(pieces, pieceId) {
  return pieces.find((piece) => piece.id === pieceId) ?? null;
}

function getPieceAt(boardMap, x, y) {
  return boardMap.get(`${x},${y}`) ?? null;
}

function isInsideBoard(x, y) {
  return x >= 0 && x <= 8 && y >= 0 && y <= 9;
}

function isInsidePalace(side, x, y) {
  const yMin = side === "red" ? 7 : 0;
  const yMax = side === "red" ? 9 : 2;
  return x >= 3 && x <= 5 && y >= yMin && y <= yMax;
}

function hasCrossedRiver(side, y) {
  return side === "red" ? y <= 4 : y >= 5;
}

function countBetween(boardMap, from, to) {
  if (from.x !== to.x && from.y !== to.y) {
    return Infinity;
  }

  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  let x = from.x + stepX;
  let y = from.y + stepY;
  let count = 0;

  while (x !== to.x || y !== to.y) {
    if (getPieceAt(boardMap, x, y)) {
      count += 1;
    }
    x += stepX;
    y += stepY;
  }

  return count;
}

function pushMoveIfValid(moves, boardMap, piece, x, y) {
  if (!isInsideBoard(x, y)) {
    return;
  }

  const occupant = getPieceAt(boardMap, x, y);
  if (occupant && occupant.side === piece.side) {
    return;
  }

  moves.push({
    x,
    y,
    captureId: occupant?.id ?? null,
    captureLabel: occupant?.label ?? null,
    captureType: occupant?.type ?? null,
  });
}

function getPseudoLegalMoves(piece, pieces) {
  const boardMap = createBoardMap(pieces);
  const moves = [];

  if (piece.type === "rook") {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    directions.forEach(([dx, dy]) => {
      let x = piece.x + dx;
      let y = piece.y + dy;

      while (isInsideBoard(x, y)) {
        const occupant = getPieceAt(boardMap, x, y);
        if (!occupant) {
          moves.push({ x, y, captureId: null, captureLabel: null, captureType: null });
        } else {
          if (occupant.side !== piece.side) {
            moves.push({
              x,
              y,
              captureId: occupant.id,
              captureLabel: occupant.label,
              captureType: occupant.type,
            });
          }
          break;
        }
        x += dx;
        y += dy;
      }
    });
  }

  if (piece.type === "cannon") {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    directions.forEach(([dx, dy]) => {
      let x = piece.x + dx;
      let y = piece.y + dy;
      let foundScreen = false;

      while (isInsideBoard(x, y)) {
        const occupant = getPieceAt(boardMap, x, y);

        if (!foundScreen) {
          if (!occupant) {
            moves.push({ x, y, captureId: null, captureLabel: null, captureType: null });
          } else {
            foundScreen = true;
          }
        } else if (occupant) {
          if (occupant.side !== piece.side) {
            moves.push({
              x,
              y,
              captureId: occupant.id,
              captureLabel: occupant.label,
              captureType: occupant.type,
            });
          }
          break;
        }

        x += dx;
        y += dy;
      }
    });
  }

  if (piece.type === "horse") {
    const patterns = [
      { dx: 2, dy: 1, blockX: 1, blockY: 0 },
      { dx: 2, dy: -1, blockX: 1, blockY: 0 },
      { dx: -2, dy: 1, blockX: -1, blockY: 0 },
      { dx: -2, dy: -1, blockX: -1, blockY: 0 },
      { dx: 1, dy: 2, blockX: 0, blockY: 1 },
      { dx: -1, dy: 2, blockX: 0, blockY: 1 },
      { dx: 1, dy: -2, blockX: 0, blockY: -1 },
      { dx: -1, dy: -2, blockX: 0, blockY: -1 },
    ];

    patterns.forEach(({ dx, dy, blockX, blockY }) => {
      if (getPieceAt(boardMap, piece.x + blockX, piece.y + blockY)) {
        return;
      }

      pushMoveIfValid(moves, boardMap, piece, piece.x + dx, piece.y + dy);
    });
  }

  if (piece.type === "elephant") {
    const patterns = [
      { dx: 2, dy: 2, eyeX: 1, eyeY: 1 },
      { dx: 2, dy: -2, eyeX: 1, eyeY: -1 },
      { dx: -2, dy: 2, eyeX: -1, eyeY: 1 },
      { dx: -2, dy: -2, eyeX: -1, eyeY: -1 },
    ];

    patterns.forEach(({ dx, dy, eyeX, eyeY }) => {
      const targetX = piece.x + dx;
      const targetY = piece.y + dy;

      if (!isInsideBoard(targetX, targetY)) {
        return;
      }

      if (piece.side === "red" && targetY <= 4) {
        return;
      }

      if (piece.side === "black" && targetY >= 5) {
        return;
      }

      if (getPieceAt(boardMap, piece.x + eyeX, piece.y + eyeY)) {
        return;
      }

      pushMoveIfValid(moves, boardMap, piece, targetX, targetY);
    });
  }

  if (piece.type === "advisor") {
    const patterns = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    patterns.forEach(([dx, dy]) => {
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (!isInsidePalace(piece.side, x, y)) {
        return;
      }
      pushMoveIfValid(moves, boardMap, piece, x, y);
    });
  }

  if (piece.type === "general") {
    const patterns = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    patterns.forEach(([dx, dy]) => {
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (!isInsidePalace(piece.side, x, y)) {
        return;
      }
      pushMoveIfValid(moves, boardMap, piece, x, y);
    });

    const enemyGeneral = pieces.find(
      (target) => target.side !== piece.side && target.type === "general",
    );

    if (
      enemyGeneral &&
      enemyGeneral.x === piece.x &&
      countBetween(boardMap, piece, enemyGeneral) === 0
    ) {
      moves.push({
        x: enemyGeneral.x,
        y: enemyGeneral.y,
        captureId: enemyGeneral.id,
        captureLabel: enemyGeneral.label,
        captureType: enemyGeneral.type,
      });
    }
  }

  if (piece.type === "soldier") {
    const forwardY = piece.side === "red" ? piece.y - 1 : piece.y + 1;
    pushMoveIfValid(moves, boardMap, piece, piece.x, forwardY);

    if (hasCrossedRiver(piece.side, piece.y)) {
      pushMoveIfValid(moves, boardMap, piece, piece.x - 1, piece.y);
      pushMoveIfValid(moves, boardMap, piece, piece.x + 1, piece.y);
    }
  }

  return moves;
}

function applyMove(pieces, move) {
  return pieces.reduce((nextPieces, piece) => {
    if (piece.id === move.captureId) {
      return nextPieces;
    }

    if (piece.id === move.pieceId) {
      nextPieces.push({
        ...piece,
        x: move.to.x,
        y: move.to.y,
      });
      return nextPieces;
    }

    nextPieces.push({ ...piece });
    return nextPieces;
  }, []);
}

function isSquareAttacked(x, y, bySide, pieces) {
  return pieces.some((piece) => {
    if (piece.side !== bySide) {
      return false;
    }

    return getPseudoLegalMoves(piece, pieces).some((move) => move.x === x && move.y === y);
  });
}

function isInCheck(side, pieces) {
  const general = pieces.find((piece) => piece.side === side && piece.type === "general");
  if (!general) {
    return true;
  }

  return isSquareAttacked(general.x, general.y, getOppositeSide(side), pieces);
}

function getCheckedSide(pieces) {
  if (isInCheck("red", pieces)) {
    return "red";
  }
  if (isInCheck("black", pieces)) {
    return "black";
  }
  return null;
}

function getLegalMovesForPiece(piece, pieces) {
  return getPseudoLegalMoves(piece, pieces).filter((move) => {
    const nextPieces = applyMove(pieces, {
      pieceId: piece.id,
      captureId: move.captureId,
      to: { x: move.x, y: move.y },
    });

    return !isInCheck(piece.side, nextPieces);
  });
}

function buildPieceLegalMoves(piece, pieces) {
  return getLegalMovesForPiece(piece, pieces).map((move) => ({
    ...move,
    pieceId: piece.id,
    from: { x: piece.x, y: piece.y },
    to: { x: move.x, y: move.y },
  }));
}

function getAllLegalMoves(side, pieces) {
  const moves = [];

  pieces.forEach((piece) => {
    if (piece.side !== side) {
      return;
    }

    buildPieceLegalMoves(piece, pieces).forEach((move) => {
      moves.push({
        ...move,
        pieceType: piece.type,
        pieceLabel: piece.label,
      });
    });
  });

  return moves;
}

function getPercentPosition(x, y) {
  return {
    left: boardMetrics.padX + x * boardMetrics.cellX,
    top: boardMetrics.padY + y * boardMetrics.cellY,
  };
}

function getBoardCoordinateFromEvent(event) {
  const rect = boardSurface.getBoundingClientRect();
  const percentX = ((event.clientX - rect.left) / rect.width) * 100;
  const percentY = ((event.clientY - rect.top) / rect.height) * 100;

  const x = Math.round((percentX - boardMetrics.padX) / boardMetrics.cellX);
  const y = Math.round((percentY - boardMetrics.padY) / boardMetrics.cellY);

  if (!isInsideBoard(x, y)) {
    return null;
  }

  const anchor = getPercentPosition(x, y);
  const withinX = Math.abs(percentX - anchor.left) <= boardMetrics.cellX * 0.48;
  const withinY = Math.abs(percentY - anchor.top) <= boardMetrics.cellY * 0.48;

  if (!withinX || !withinY) {
    return null;
  }

  return { x, y };
}

function formatCoord(point) {
  return `(${point.x + 1}, ${point.y + 1})`;
}

function setInspectorPiece(pieceId) {
  const piece = getPieceById(gameState.pieces, pieceId);
  if (!piece) {
    return;
  }

  gameState.inspectedPieceId = piece.id;
}

function getInspectorPiece() {
  return (
    getPieceById(gameState.pieces, gameState.inspectedPieceId) ??
    getPieceById(gameState.pieces, gameState.selectedPieceId) ??
    getPieceById(gameState.pieces, "r-general") ??
    gameState.pieces[0]
  );
}

function updateInspector() {
  const piece = getInspectorPiece();
  const profile = pieceProfiles[piece.type];

  inspectorTitle.textContent = profile.title;
  inspectorBadge.textContent = `${getSideLabel(piece.side)} · ${piece.label}`;
  inspectorText.textContent = profile.summary;
}

function clearSelection({ keepHint = false } = {}) {
  gameState.selectedPieceId = null;
  gameState.legalMoves = [];

  if (!keepHint) {
    gameState.hintTarget = null;
  }
}

function selectPiece(pieceId, message) {
  const piece = getPieceById(gameState.pieces, pieceId);
  if (!piece || piece.side !== gameState.turn || gameState.winner) {
    return;
  }

  const legalMoves = buildPieceLegalMoves(piece, gameState.pieces);
  gameState.selectedPieceId = piece.id;
  gameState.legalMoves = legalMoves;
  gameState.hintTarget = null;
  setInspectorPiece(piece.id);
  gameState.statusText =
    message ?? `${getSideLabel(piece.side)}选中了${piece.label}，共有 ${legalMoves.length} 个合法落点。`;
  render();
}

function getLegalMoveByTarget(x, y) {
  return gameState.legalMoves.find((move) => move.x === x && move.y === y) ?? null;
}

function buildMoveRecord(piece, move, winner, nextSide, isCheck) {
  const actionText = move.captureLabel ? ` 吃${move.captureLabel}` : "";
  let outcomeText = "正常";

  if (winner) {
    outcomeText = winner === piece.side ? "制胜" : "结束";
  } else if (isCheck) {
    outcomeText = "将军";
  } else if (move.captureLabel) {
    outcomeText = "吃子";
  }

  return {
    side: piece.side,
    notation: `${piece.label} ${formatCoord(move.from)} -> ${formatCoord(move.to)}${actionText}`,
    outcomeText,
  };
}

function performMove(move) {
  const movingPiece = getPieceById(gameState.pieces, move.pieceId);
  if (!movingPiece) {
    return;
  }

  const snapshot = clonePieces(gameState.pieces);
  const previousTurn = gameState.turn;
  const previousLastMove = gameState.lastMove ? { ...gameState.lastMove } : null;
  const nextSide = getOppositeSide(movingPiece.side);
  const nextPieces = applyMove(gameState.pieces, move);
  const opponentGeneral = nextPieces.find(
    (piece) => piece.side === nextSide && piece.type === "general",
  );

  let winner = null;
  let checkSide = null;
  let statusText = "";

  if (!opponentGeneral) {
    winner = movingPiece.side;
    statusText = `${getSideLabel(movingPiece.side)}胜利，将帅已被吃掉。`;
  } else {
    const opponentInCheck = isInCheck(nextSide, nextPieces);
    const opponentMoves = getAllLegalMoves(nextSide, nextPieces);
    checkSide = opponentInCheck ? nextSide : null;

    if (opponentMoves.length === 0) {
      winner = movingPiece.side;
      statusText = opponentInCheck
        ? `${getSideLabel(movingPiece.side)}胜利，形成将死。`
        : `${getSideLabel(movingPiece.side)}胜利，对手已无合法着法。`;
    } else {
      statusText = opponentInCheck
        ? `${getSideLabel(nextSide)}被将军，请应将。`
        : `${getSideLabel(nextSide)}行棋。`;
    }
  }

  const record = buildMoveRecord(movingPiece, move, winner, nextSide, checkSide === nextSide);

  gameState.history.push({
    snapshot,
    previousTurn,
    previousLastMove,
    record,
  });

  gameState.pieces = nextPieces;
  gameState.turn = nextSide;
  gameState.winner = winner;
  gameState.lastMove = {
    pieceId: move.pieceId,
    from: { ...move.from },
    to: { ...move.to },
  };
  gameState.checkSide = checkSide;
  gameState.statusText = statusText;
  gameState.inspectedPieceId = move.pieceId;
  clearSelection();
  render();
}

function restoreStatusAfterUndo() {
  const checkedSide = getCheckedSide(gameState.pieces);
  gameState.checkSide = checkedSide;
  gameState.winner = null;
  gameState.statusText = checkedSide
    ? `${getSideLabel(checkedSide)}被将军，已回退到上一手。`
    : `${getSideLabel(gameState.turn)}行棋，已悔回上一步。`;
}

function handleUndo() {
  if (!gameState.history.length) {
    return;
  }

  const lastEntry = gameState.history.pop();
  gameState.pieces = clonePieces(lastEntry.snapshot);
  gameState.turn = lastEntry.previousTurn;
  gameState.lastMove = lastEntry.previousLastMove;
  gameState.inspectedPieceId =
    getPieceById(gameState.pieces, gameState.inspectedPieceId)?.id ??
    getPieceById(gameState.pieces, `${gameState.turn === "red" ? "r" : "b"}-general`)?.id ??
    "r-general";
  clearSelection();
  restoreStatusAfterUndo();
  render();
}

function handleReset() {
  gameState = createInitialGameState();
  render();
}

function handleHint() {
  if (gameState.winner) {
    return;
  }

  const allMoves = getAllLegalMoves(gameState.turn, gameState.pieces);
  if (!allMoves.length) {
    gameState.statusText = `${getSideLabel(gameState.turn)}当前没有合法着法。`;
    render();
    return;
  }

  const suggestedMove =
    allMoves.find((move) => move.captureId) ??
    allMoves.find((move) => move.pieceType === "cannon") ??
    allMoves[0];

  gameState.selectedPieceId = suggestedMove.pieceId;
  gameState.legalMoves = buildPieceLegalMoves(
    getPieceById(gameState.pieces, suggestedMove.pieceId),
    gameState.pieces,
  );
  gameState.hintTarget = {
    pieceId: suggestedMove.pieceId,
    x: suggestedMove.x,
    y: suggestedMove.y,
  };
  gameState.inspectedPieceId = suggestedMove.pieceId;
  gameState.statusText = `提示：可考虑${suggestedMove.pieceLabel}走到${formatCoord({
    x: suggestedMove.x,
    y: suggestedMove.y,
  })}。`;
  render();
}

function handleIntersectionClick(x, y) {
  const boardMap = createBoardMap(gameState.pieces);
  const clickedPiece = getPieceAt(boardMap, x, y);

  if (clickedPiece) {
    setInspectorPiece(clickedPiece.id);
  }

  if (gameState.winner) {
    render();
    return;
  }

  if (clickedPiece && clickedPiece.side === gameState.turn) {
    if (gameState.selectedPieceId === clickedPiece.id) {
      clearSelection();
      gameState.statusText = `${getSideLabel(gameState.turn)}取消了当前选子。`;
      render();
      return;
    }

    selectPiece(clickedPiece.id);
    return;
  }

  const targetMove = getLegalMoveByTarget(x, y);
  if (targetMove) {
    performMove(targetMove);
    return;
  }

  clearSelection();
  gameState.statusText = clickedPiece
    ? `现在轮到${getSideLabel(gameState.turn)}行棋。`
    : `${getSideLabel(gameState.turn)}行棋。`;
  render();
}

function renderPieces() {
  const fragment = document.createDocumentFragment();
  const lastMovedPieceId = gameState.lastMove?.pieceId ?? null;

  gameState.pieces.forEach((piece, index) => {
    const { left, top } = getPercentPosition(piece.x, piece.y);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "piece",
      piece.side === "red" ? "piece-red" : "piece-black",
      piece.id === gameState.selectedPieceId ? "selected" : "",
      piece.id === lastMovedPieceId ? "last-moved" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.style.left = `${left}%`;
    button.style.top = `${top}%`;
    button.style.animationDelay = `${index * 12}ms`;
    button.innerHTML = `<span>${piece.label}</span>`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleIntersectionClick(piece.x, piece.y);
    });
    fragment.appendChild(button);
  });

  piecesLayer.replaceChildren(fragment);
}

function renderLegalMoves() {
  const fragment = document.createDocumentFragment();

  gameState.legalMoves.forEach((move) => {
    const marker = document.createElement("button");
    const { left, top } = getPercentPosition(move.x, move.y);
    const isHint =
      gameState.hintTarget &&
      gameState.hintTarget.pieceId === gameState.selectedPieceId &&
      gameState.hintTarget.x === move.x &&
      gameState.hintTarget.y === move.y;

    marker.type = "button";
    marker.className = [
      "legal-point",
      move.captureId ? "capture" : "quiet",
      isHint ? "is-hint" : "",
    ]
      .filter(Boolean)
      .join(" ");
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
    marker.addEventListener("click", (event) => {
      event.stopPropagation();
      performMove(move);
    });
    fragment.appendChild(marker);
  });

  legalLayer.replaceChildren(fragment);
}

function renderMoveHighlight() {
  if (!gameState.lastMove) {
    moveHighlight.classList.remove("is-visible");
    return;
  }

  const fromPos = getPercentPosition(gameState.lastMove.from.x, gameState.lastMove.from.y);
  const toPos = getPercentPosition(gameState.lastMove.to.x, gameState.lastMove.to.y);

  moveHighlight.style.setProperty("--from-x", `${fromPos.left}%`);
  moveHighlight.style.setProperty("--from-y", `${fromPos.top}%`);
  moveHighlight.style.setProperty("--to-x", `${toPos.left}%`);
  moveHighlight.style.setProperty("--to-y", `${toPos.top}%`);
  moveHighlight.classList.add("is-visible");
}

function renderMoveList() {
  const fragment = document.createDocumentFragment();

  if (!gameState.history.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "move-item empty";
    emptyState.textContent = "对局记录会在这里实时生成。";
    fragment.appendChild(emptyState);
    moveList.replaceChildren(fragment);
    return;
  }

  gameState.history.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = `move-item${index === gameState.history.length - 1 ? " is-latest" : ""}`;
    item.innerHTML = `
      <span class="move-index">${index + 1}</span>
      <div>
        <strong class="move-notation">${entry.record.notation}</strong>
        <div class="move-side">${getSideLabel(entry.record.side)}落子</div>
      </div>
      <span class="move-side">${entry.record.outcomeText}</span>
    `;
    fragment.appendChild(item);
  });

  moveList.replaceChildren(fragment);
}

function renderOverview() {
  const currentLegalMoves = gameState.winner
    ? []
    : getAllLegalMoves(gameState.turn, gameState.pieces);

  gameStatePill.textContent = gameState.winner
    ? "对局结束"
    : gameState.checkSide
      ? "将军"
      : "本地对弈";
  phaseLabel.textContent = `双人同屏 · 已吃 ${initialPieces.length - gameState.pieces.length} 子`;
  turnStrip.textContent = gameState.winner
    ? `${getSideLabel(gameState.winner)}胜利`
    : gameState.checkSide
      ? `${getSideLabel(gameState.turn)}应将`
      : `${getSideLabel(gameState.turn)}行棋`;

  evalChip.textContent = gameState.winner
    ? `${getSideLabel(gameState.winner)}胜`
    : gameState.checkSide
      ? `${getSideLabel(gameState.checkSide)}被将军`
      : `${getSideLabel(gameState.turn)}先手中`;

  currentDescription.textContent = gameState.statusText;
  currentStepEl.textContent = String(gameState.history.length);
  turnLabel.textContent = gameState.winner
    ? `${getSideLabel(gameState.winner)}获胜`
    : getSideLabel(gameState.turn);

  if (gameState.hintTarget) {
    engineSuggestion.textContent = `提示落点 ${formatCoord(gameState.hintTarget)}`;
    return;
  }

  if (gameState.selectedPieceId) {
    const selectedPiece = getPieceById(gameState.pieces, gameState.selectedPieceId);
    engineSuggestion.textContent = `${selectedPiece.label} 可走 ${gameState.legalMoves.length} 步`;
    return;
  }

  if (gameState.winner) {
    engineSuggestion.textContent = "点击重新开局可立即再来一盘";
    return;
  }

  engineSuggestion.textContent = `当前共有 ${currentLegalMoves.length} 种合法着法`;
}

function renderPlayerCards() {
  const activeSide = gameState.winner ?? gameState.turn;

  playerRedCard.classList.toggle("is-active", activeSide === "red");
  playerBlackCard.classList.toggle("is-active", activeSide === "black");
  playerRedCard.classList.toggle("is-in-check", gameState.checkSide === "red");
  playerBlackCard.classList.toggle("is-in-check", gameState.checkSide === "black");
}

function renderButtons() {
  undoBtn.disabled = !gameState.history.length;
  hintBtn.disabled = Boolean(gameState.winner);
}

function render() {
  updateInspector();
  renderPieces();
  renderLegalMoves();
  renderMoveHighlight();
  renderMoveList();
  renderOverview();
  renderPlayerCards();
  renderButtons();
}

boardSurface.addEventListener("click", (event) => {
  const point = getBoardCoordinateFromEvent(event);
  if (!point) {
    return;
  }

  handleIntersectionClick(point.x, point.y);
});

undoBtn.addEventListener("click", handleUndo);
resetBtn.addEventListener("click", handleReset);
hintBtn.addEventListener("click", handleHint);

themeSwitch.addEventListener("click", () => {
  document.body.classList.toggle("theme-jade");
  const isJade = document.body.classList.contains("theme-jade");
  themeSwitch.textContent = isJade ? "切回木纹主题" : "切换玉石主题";
});

render();
window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});
