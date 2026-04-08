const START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
const ENGINE_TIME_OPTIONS = [400, 800, 1500, 2500];
const DEFAULT_MODE = window.location.protocol.startsWith("http") ? "engine" : "local";

const boardSurface = document.querySelector("#boardSurface");
const piecesLayer = document.querySelector("#piecesLayer");
const legalLayer = document.querySelector("#legalLayer");
const moveList = document.querySelector("#moveList");
const moveHighlight = document.querySelector("#moveHighlight");
const hintArrowLayer = document.querySelector("#hintArrowLayer");
const hintArrowLine = document.querySelector("#hintArrowLine");

const undoBtn = document.querySelector("#undoBtn");
const resetBtn = document.querySelector("#resetBtn");
const hintBtn = document.querySelector("#hintBtn");
const themeSwitch = document.querySelector("#themeSwitch");

const localModeBtn = document.querySelector("#localModeBtn");
const localFlipBtn = document.querySelector("#localFlipBtn");
const engineModeBtn = document.querySelector("#engineModeBtn");
const engineSideBtn = document.querySelector("#engineSideBtn");
const engineTimeBtn = document.querySelector("#engineTimeBtn");

const gameStatePill = document.querySelector("#gameStatePill");
const phaseLabel = document.querySelector("#phaseLabel");
const turnStrip = document.querySelector("#turnStrip");
const playerBlackCard = document.querySelector("#playerBlackCard");
const playerRedCard = document.querySelector("#playerRedCard");
const topPlayerAvatar = playerBlackCard.querySelector(".avatar");
const topPlayerSide = playerBlackCard.querySelector(".player-side");
const blackPlayerName = document.querySelector("#blackPlayerName");
const blackPlayerTag = document.querySelector("#blackPlayerTag");
const bottomPlayerAvatar = playerRedCard.querySelector(".avatar");
const bottomPlayerSide = playerRedCard.querySelector(".player-side");
const redPlayerName = document.querySelector("#redPlayerName");
const redPlayerTag = document.querySelector("#redPlayerTag");

const gameTitle = document.querySelector("#gameTitle");
const currentDescription = document.querySelector("#currentDescription");
const engineSuggestion = document.querySelector("#engineSuggestion");
const currentStepEl = document.querySelector("#currentStep");
const turnLabel = document.querySelector("#turnLabel");
const evalChip = document.querySelector("#evalChip");
const analysisScoreValue = document.querySelector("#analysisScoreValue");
const analysisVerdict = document.querySelector("#analysisVerdict");
const analysisRedValue = document.querySelector("#analysisRedValue");
const analysisRawValue = document.querySelector("#analysisRawValue");
const analysisBlackValue = document.querySelector("#analysisBlackValue");
const analysisTrendSummary = document.querySelector("#analysisTrendSummary");
const analysisTrendChart = document.querySelector("#analysisTrendChart");
const analysisTrendLine = document.querySelector("#analysisTrendLine");
const analysisTrendDot = document.querySelector("#analysisTrendDot");

const inspectorTitle = document.querySelector("#inspectorTitle");
const inspectorBadge = document.querySelector("#inspectorBadge");
const inspectorText = document.querySelector("#inspectorText");

const TTXQ_BALANCE_THRESHOLD = 48;
const TTXQ_CP_CAP = 999;
const TTXQ_MATE_SCORE = 29999;
const TTXQ_CHART_CAP = 1200;
const POSITION_ANALYSIS_MOVETIME = 260;
const ANALYSIS_SERIES_LIMIT = 36;
const RED_NOTATION_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

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
    summary: "只能在九宫内直走一格，同时要避免与对方将帅隔空照面。",
  },
  advisor: {
    title: "仕士",
    summary: "在九宫里斜走一格，负责贴身保护将帅和巩固中腹结构。",
  },
  elephant: {
    title: "相象",
    summary: "斜走两格且不能过河，中点被堵住就会形成典型的塞象眼。",
  },
  horse: {
    title: "马",
    summary: "走日字，先迈一步的马腿若被挡住，就会出现蹩马腿。",
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
    summary: "过河前只能前进，过河后才能横走，是空间推进最关键的基础子。",
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
    statusText:
      DEFAULT_MODE === "engine"
        ? "正在连接 Pikafish..."
        : "红方先行，点击棋子开始对局。",
    hintTarget: null,
    checkSide: null,
    mode: DEFAULT_MODE,
    localBottomSide: "red",
    engineSide: "black",
    engineThinking: false,
    engineAvailable: false,
    engineReady: false,
    engineStatus: "未连接",
    engineMoveTime: 800,
    pendingEngineRequestId: 0,
    pendingAnalysisRequestId: 0,
    uciMoves: [],
    lastEngineInfo: null,
    positionAnalysisInfo: null,
    analysisSeries: [],
    analysisThinking: false,
  };
}

let gameState = createInitialGameState();

function clonePieces(pieces) {
  return pieces.map((piece) => ({ ...piece }));
}

function clonePoint(point) {
  return point ? { x: point.x, y: point.y } : null;
}

function cloneLastMove(lastMove) {
  return lastMove
    ? {
        pieceId: lastMove.pieceId,
        from: clonePoint(lastMove.from),
        to: clonePoint(lastMove.to),
      }
    : null;
}

function cloneEngineInfo(info) {
  return info
    ? {
        ...info,
        pv: Array.isArray(info.pv) ? [...info.pv] : [],
      }
    : null;
}

function cloneAnalysisInfo(info) {
  return info ? { ...info } : null;
}

function cloneAnalysisSeries(series) {
  return series.map((entry) => ({ ...entry }));
}

function createSnapshot() {
  return {
    pieces: clonePieces(gameState.pieces),
    turn: gameState.turn,
    winner: gameState.winner,
    lastMove: cloneLastMove(gameState.lastMove),
    inspectedPieceId: gameState.inspectedPieceId,
    checkSide: gameState.checkSide,
    uciMoves: [...gameState.uciMoves],
    lastEngineInfo: cloneEngineInfo(gameState.lastEngineInfo),
    positionAnalysisInfo: cloneAnalysisInfo(gameState.positionAnalysisInfo),
    analysisSeries: cloneAnalysisSeries(gameState.analysisSeries),
  };
}

function restoreSnapshot(snapshot) {
  gameState.pieces = clonePieces(snapshot.pieces);
  gameState.turn = snapshot.turn;
  gameState.winner = snapshot.winner;
  gameState.lastMove = cloneLastMove(snapshot.lastMove);
  gameState.inspectedPieceId = snapshot.inspectedPieceId;
  gameState.checkSide = snapshot.checkSide;
  gameState.uciMoves = [...snapshot.uciMoves];
  gameState.lastEngineInfo = cloneEngineInfo(snapshot.lastEngineInfo);
  gameState.positionAnalysisInfo = cloneAnalysisInfo(snapshot.positionAnalysisInfo);
  gameState.analysisSeries = cloneAnalysisSeries(snapshot.analysisSeries ?? []);
  clearSelection();
}

function getSideLabel(side) {
  return side === "red" ? "红方" : "黑方";
}

function getOppositeSide(side) {
  return side === "red" ? "black" : "red";
}

function getHumanSide() {
  return gameState.mode === "engine" ? getOppositeSide(gameState.engineSide) : null;
}

function shouldFlipBoard() {
  return gameState.mode === "engine"
    ? getHumanSide() === "black"
    : gameState.localBottomSide === "black";
}

function toDisplayCoordinate(point) {
  if (!point) {
    return null;
  }

  if (!shouldFlipBoard()) {
    return { x: point.x, y: point.y };
  }

  return {
    x: 8 - point.x,
    y: 9 - point.y,
  };
}

function toGameCoordinate(point) {
  if (!point) {
    return null;
  }

  if (!shouldFlipBoard()) {
    return { x: point.x, y: point.y };
  }

  return {
    x: 8 - point.x,
    y: 9 - point.y,
  };
}

function isEngineTurn() {
  return (
    gameState.mode === "engine" &&
    gameState.engineAvailable &&
    !gameState.winner &&
    gameState.turn === gameState.engineSide
  );
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
  const displayPoint = toDisplayCoordinate({ x, y });
  return {
    left: boardMetrics.padX + displayPoint.x * boardMetrics.cellX,
    top: boardMetrics.padY + displayPoint.y * boardMetrics.cellY,
  };
}

function getBoardCoordinateFromEvent(event) {
  const rect = boardSurface.getBoundingClientRect();
  const percentX = ((event.clientX - rect.left) / rect.width) * 100;
  const percentY = ((event.clientY - rect.top) / rect.height) * 100;

  const displayX = Math.round((percentX - boardMetrics.padX) / boardMetrics.cellX);
  const displayY = Math.round((percentY - boardMetrics.padY) / boardMetrics.cellY);
  const point = toGameCoordinate({ x: displayX, y: displayY });
  const x = point.x;
  const y = point.y;

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

function hideHintArrow() {
  hintArrowLayer.classList.remove("is-visible");
}

function formatNotationNumber(side, value) {
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    return String(value);
  }

  return side === "red" ? RED_NOTATION_NUMERALS[value - 1] : String(value);
}

function getNotationFile(side, x) {
  return side === "red" ? 9 - x : x + 1;
}

function buildNotationPrefix(piece, pieces) {
  const sameFilePieces = pieces
    .filter(
      (candidate) =>
        candidate.side === piece.side && candidate.type === piece.type && candidate.x === piece.x,
    )
    .sort((a, b) => (piece.side === "red" ? a.y - b.y : b.y - a.y));

  const pieceIndex = sameFilePieces.findIndex((candidate) => candidate.id === piece.id);

  if (sameFilePieces.length === 2) {
    return `${pieceIndex === 0 ? "前" : "后"}${piece.label}`;
  }

  if (sameFilePieces.length === 3) {
    return `${["前", "中", "后"][pieceIndex] ?? ""}${piece.label}`;
  }

  return `${piece.label}${formatNotationNumber(piece.side, getNotationFile(piece.side, piece.x))}`;
}

function formatChineseMoveNotation(piece, move, pieces = gameState.pieces) {
  if (!piece || !move) {
    return "";
  }

  const prefix = buildNotationPrefix(piece, pieces);
  const forwardDelta = piece.side === "red" ? move.from.y - move.to.y : move.to.y - move.from.y;
  const action = move.from.y === move.to.y ? "平" : forwardDelta > 0 ? "进" : "退";
  const targetUsesFile = ["horse", "elephant", "advisor"].includes(piece.type) || action === "平";
  const targetValue = targetUsesFile
    ? getNotationFile(piece.side, move.to.x)
    : Math.abs(move.to.y - move.from.y);

  return `${prefix}${action}${formatNotationNumber(piece.side, targetValue)}`;
}

function getHintNotation() {
  if (!gameState.hintTarget) {
    return null;
  }

  const piece = getPieceById(gameState.pieces, gameState.hintTarget.pieceId);
  if (!piece) {
    return null;
  }

  return formatChineseMoveNotation(
    piece,
    {
      from: { x: piece.x, y: piece.y },
      to: { x: gameState.hintTarget.x, y: gameState.hintTarget.y },
    },
    gameState.pieces,
  );
}

function toUciSquare(x, y) {
  return `${String.fromCharCode(97 + x)}${9 - y}`;
}

function fromUciSquare(square) {
  if (!/^[a-i][0-9]$/.test(square)) {
    return null;
  }

  const x = square.charCodeAt(0) - 97;
  const y = 9 - Number(square[1]);

  if (!isInsideBoard(x, y)) {
    return null;
  }

  return { x, y };
}

function moveToUci(move) {
  return `${toUciSquare(move.from.x, move.from.y)}${toUciSquare(move.to.x, move.to.y)}`;
}

function uciToMove(uci, pieces) {
  if (typeof uci !== "string" || uci.length < 4) {
    return null;
  }

  const from = fromUciSquare(uci.slice(0, 2));
  const to = fromUciSquare(uci.slice(2, 4));

  if (!from || !to) {
    return null;
  }

  const boardMap = createBoardMap(pieces);
  const piece = getPieceAt(boardMap, from.x, from.y);
  const target = getPieceAt(boardMap, to.x, to.y);

  if (!piece) {
    return null;
  }

  return {
    pieceId: piece.id,
    from,
    to,
    captureId: target?.id ?? null,
    captureLabel: target?.label ?? null,
    captureType: target?.type ?? null,
  };
}

function formatEngineScore(info) {
  if (!info) {
    return null;
  }

  if (typeof info.scoreMate === "number") {
    const sign = info.scoreMate > 0 ? "+" : "";
    return `杀 ${sign}${info.scoreMate}`;
  }

  if (typeof info.scoreCp === "number") {
    const cp = info.scoreCp / 100;
    const sign = cp > 0 ? "+" : "";
    return `${sign}${cp.toFixed(2)}`;
  }

  return null;
}

function mapCpToTtxqScore(scoreCp) {
  if (!Number.isFinite(scoreCp)) {
    return 0;
  }

  return Math.round(TTXQ_CP_CAP * Math.tanh(scoreCp / 300));
}

function buildTtxqAnalysis(info, sideToMove = gameState.turn) {
  if (!info) {
    return null;
  }

  const rawScoreLabel = formatEngineScore(info) ?? "无分数";
  const normalizedSideToMove = sideToMove === "black" ? "black" : "red";
  const redPerspectiveFactor = normalizedSideToMove === "red" ? 1 : -1;
  let mappedScore = 0;
  let chartScore = 0;

  if (typeof info.scoreMate === "number" && info.scoreMate !== 0) {
    const redPerspectiveMate = info.scoreMate * redPerspectiveFactor;
    mappedScore = redPerspectiveMate > 0 ? TTXQ_MATE_SCORE : -TTXQ_MATE_SCORE;
    chartScore = redPerspectiveMate > 0 ? TTXQ_CHART_CAP : -TTXQ_CHART_CAP;
  } else if (typeof info.scoreCp === "number") {
    const redPerspectiveCp = info.scoreCp * redPerspectiveFactor;
    mappedScore = mapCpToTtxqScore(redPerspectiveCp);
    chartScore = mappedScore;

    if (Math.abs(mappedScore) <= TTXQ_BALANCE_THRESHOLD) {
      mappedScore = 0;
      chartScore = 0;
    }
  }

  const advantageSide =
    mappedScore > 0 ? "red" : mappedScore < 0 ? "black" : "even";
  const advantageValue = Math.abs(mappedScore);
  const verdict =
    advantageSide === "red"
      ? advantageValue === TTXQ_MATE_SCORE
        ? "红优绝杀"
        : "红优"
      : advantageSide === "black"
        ? advantageValue === TTXQ_MATE_SCORE
          ? "黑优绝杀"
          : "黑优"
        : "均势";

  return {
    depth: typeof info.depth === "number" ? info.depth : null,
    sideToMove: normalizedSideToMove,
    rawScoreLabel,
    rawDisplayLabel: `原始 ${rawScoreLabel} · ${getSideLabel(normalizedSideToMove)}视角`,
    mappedScore,
    chartScore,
    advantageSide,
    verdict,
    scoreText: String(advantageValue),
    ttxqLabel:
      advantageSide === "even" ? "均势" : `${advantageSide === "red" ? "红优" : "黑优"} ${advantageValue}`,
    redLabel: `红优 ${mappedScore > 0 ? advantageValue : 0}`,
    blackLabel: `黑优 ${mappedScore < 0 ? advantageValue : 0}`,
  };
}

function upsertAnalysisSeries(analysis) {
  if (!analysis) {
    return;
  }

  const nextEntry = {
    ply: gameState.uciMoves.length,
    mappedScore: analysis.mappedScore,
    chartScore: analysis.chartScore,
    verdict: analysis.verdict,
    ttxqLabel: analysis.ttxqLabel,
    rawScoreLabel: analysis.rawScoreLabel,
  };

  const previous = gameState.analysisSeries.at(-1);
  if (previous && previous.ply === nextEntry.ply) {
    gameState.analysisSeries[gameState.analysisSeries.length - 1] = nextEntry;
  } else {
    gameState.analysisSeries.push(nextEntry);
    if (gameState.analysisSeries.length > ANALYSIS_SERIES_LIMIT) {
      gameState.analysisSeries = gameState.analysisSeries.slice(-ANALYSIS_SERIES_LIMIT);
    }
  }
}

function formatEngineInfoShort(info) {
  if (!info) {
    return gameState.engineStatus;
  }

  const parts = [];

  if (typeof info.depth === "number") {
    parts.push(`深度 ${info.depth}`);
  }

  const score = formatEngineScore(info);
  if (score) {
    parts.push(`分数 ${score}`);
  }

  if (Array.isArray(info.pv) && info.pv.length) {
    parts.push(`主变 ${info.pv[0]}`);
  }

  return parts.join(" · ") || gameState.engineStatus;
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

function shouldAutoSuggestMove() {
  return gameState.mode === "local" && gameState.engineAvailable && !gameState.winner;
}

function applySuggestedMoveHint(suggestedMove, { selectPiece = false } = {}) {
  if (!suggestedMove) {
    gameState.hintTarget = null;
    return null;
  }

  const piece = getPieceById(gameState.pieces, suggestedMove.pieceId);
  if (!piece) {
    gameState.hintTarget = null;
    return null;
  }

  if (selectPiece) {
    gameState.selectedPieceId = suggestedMove.pieceId;
    gameState.legalMoves = buildPieceLegalMoves(piece, gameState.pieces);
  }

  gameState.hintTarget = {
    pieceId: suggestedMove.pieceId,
    x: suggestedMove.to?.x ?? suggestedMove.x,
    y: suggestedMove.to?.y ?? suggestedMove.y,
  };
  gameState.inspectedPieceId = suggestedMove.pieceId;
  return piece;
}

function cancelPendingEngineRequest() {
  gameState.pendingEngineRequestId += 1;
  gameState.engineThinking = false;
}

function cancelPendingAnalysisRequest() {
  gameState.pendingAnalysisRequestId += 1;
  gameState.analysisThinking = false;
}

function shouldAutoAnalyzePosition(actor) {
  if (!gameState.engineAvailable || gameState.engineThinking) {
    return false;
  }

  if (gameState.mode === "engine") {
    return actor === "engine" || Boolean(gameState.winner);
  }

  return true;
}

async function refreshPositionAnalysis(movetime = POSITION_ANALYSIS_MOVETIME) {
  if (!gameState.engineAvailable || gameState.engineThinking) {
    return false;
  }

  const analysisTurn = gameState.turn;
  const requestId = gameState.pendingAnalysisRequestId + 1;
  gameState.pendingAnalysisRequestId = requestId;
  gameState.analysisThinking = true;

  try {
    const payload = await requestEngineAnalysis(movetime);
    if (requestId !== gameState.pendingAnalysisRequestId) {
      return false;
    }

    const parsedInfo = parseEngineInfo(payload.rawInfo ?? null);
    if (!parsedInfo) {
      return false;
    }

    gameState.lastEngineInfo = parsedInfo;
    gameState.positionAnalysisInfo = buildTtxqAnalysis(parsedInfo, analysisTurn);
    upsertAnalysisSeries(gameState.positionAnalysisInfo);

    if (shouldAutoSuggestMove()) {
      applySuggestedMoveHint(uciToMove(payload.bestmove ?? "", gameState.pieces));
    }

    return true;
  } catch {
    return false;
  } finally {
    if (requestId === gameState.pendingAnalysisRequestId) {
      gameState.analysisThinking = false;
      render();
    }
  }
}

function canSelectPiece(piece) {
  if (!piece || piece.side !== gameState.turn || gameState.winner || gameState.engineThinking) {
    return false;
  }

  if (gameState.mode === "engine" && piece.side === gameState.engineSide) {
    return false;
  }

  return true;
}

function selectPiece(pieceId, message) {
  const piece = getPieceById(gameState.pieces, pieceId);
  if (!canSelectPiece(piece)) {
    return;
  }

  const legalMoves = buildPieceLegalMoves(piece, gameState.pieces);
  gameState.selectedPieceId = piece.id;
  gameState.legalMoves = legalMoves;
  if (!shouldAutoSuggestMove()) {
    gameState.hintTarget = null;
  }
  setInspectorPiece(piece.id);
  gameState.statusText =
    message ?? `${getSideLabel(piece.side)}选中了${piece.label}，共有 ${legalMoves.length} 个合法落点。`;
  render();
}

function getLegalMoveByTarget(x, y) {
  return gameState.legalMoves.find((move) => move.x === x && move.y === y) ?? null;
}

function buildMoveRecord(piece, move, actor, uci, winner, isCheck) {
  const actionText = move.captureLabel ? ` 吃${move.captureLabel}` : "";
  let outcomeText = "正常";

  if (winner) {
    outcomeText = "制胜";
  } else if (isCheck) {
    outcomeText = "将军";
  } else if (move.captureLabel) {
    outcomeText = "吃子";
  }

  return {
    side: piece.side,
    actor,
    actorLabel: actor === "engine" ? "Pikafish" : getSideLabel(piece.side),
    notation: `${piece.label} ${formatCoord(move.from)} -> ${formatCoord(move.to)}${actionText}`,
    uci,
    outcomeText,
  };
}

function describePostMove(actor, movingSide, nextSide, winner, inCheck) {
  if (winner) {
    return actor === "engine"
      ? `Pikafish 执${getSideLabel(movingSide)}取胜。`
      : `${getSideLabel(movingSide)}胜利。`;
  }

  if (actor === "engine") {
    return inCheck
      ? `Pikafish 落子后形成将军，${getSideLabel(nextSide)}应将。`
      : `Pikafish 已落子，轮到${getSideLabel(nextSide)}。`;
  }

  if (gameState.mode === "engine") {
    return inCheck
      ? `你这一手形成将军，Pikafish 正在应对。`
      : `你已落子，Pikafish 正在思考。`;
  }

  return inCheck ? `${getSideLabel(nextSide)}被将军，请应将。` : `${getSideLabel(nextSide)}行棋。`;
}

function performMove(
  move,
  {
    actor = "human",
    uci = moveToUci(move),
    skipRender = false,
    preserveHint = false,
    engineInfo = null,
  } = {},
) {
  const movingPiece = getPieceById(gameState.pieces, move.pieceId);
  if (!movingPiece) {
    return false;
  }

  const snapshot = createSnapshot();
  const nextSide = getOppositeSide(movingPiece.side);
  const nextPieces = applyMove(gameState.pieces, move);
  const opponentGeneral = nextPieces.find(
    (piece) => piece.side === nextSide && piece.type === "general",
  );

  let winner = null;
  let checkSide = null;

  if (!opponentGeneral) {
    winner = movingPiece.side;
  } else {
    const opponentInCheck = isInCheck(nextSide, nextPieces);
    const opponentMoves = getAllLegalMoves(nextSide, nextPieces);
    checkSide = opponentInCheck ? nextSide : null;

    if (opponentMoves.length === 0) {
      winner = movingPiece.side;
    }
  }

  const record = buildMoveRecord(movingPiece, move, actor, uci, winner, checkSide === nextSide);

  gameState.history.push({
    snapshot,
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
  gameState.statusText = describePostMove(actor, movingPiece.side, nextSide, winner, checkSide);
  gameState.inspectedPieceId = move.pieceId;
  gameState.uciMoves.push(uci);
  gameState.lastEngineInfo = actor === "engine" ? engineInfo : null;
  clearSelection({ keepHint: preserveHint });

  if (!skipRender) {
    render();
  }

  if (shouldAutoAnalyzePosition(actor)) {
    void refreshPositionAnalysis();
  }

  return true;
}

function undoSingleMove() {
  if (!gameState.history.length) {
    return false;
  }

  const lastEntry = gameState.history.pop();
  restoreSnapshot(lastEntry.snapshot);
  gameState.statusText = `${getSideLabel(gameState.turn)}行棋，已悔回上一步。`;
  return true;
}

function handleUndo() {
  if (!gameState.history.length || gameState.engineThinking) {
    return;
  }

  cancelPendingEngineRequest();

  if (
    gameState.mode === "engine" &&
    gameState.history.at(-1)?.record.actor === "engine" &&
    gameState.history.length >= 2
  ) {
    undoSingleMove();
    undoSingleMove();
    gameState.statusText = `已回退你和 Pikafish 的最近一轮着法，轮到${getSideLabel(
      gameState.turn,
    )}。`;
  } else {
    undoSingleMove();
  }

  render();

  if (gameState.engineAvailable && !isEngineTurn()) {
    void refreshPositionAnalysis();
  }
}

function getEngineTimeLabel() {
  return `思考 ${gameState.engineMoveTime}ms`;
}

function resetGame(statusText = null) {
  const preservedMode = gameState.mode;
  const preservedLocalBottomSide = gameState.localBottomSide;
  const preservedEngineSide = gameState.engineSide;
  const preservedEngineAvailable = gameState.engineAvailable;
  const preservedEngineReady = gameState.engineReady;
  const preservedEngineStatus = gameState.engineStatus;
  const preservedEngineMoveTime = gameState.engineMoveTime;

  cancelPendingEngineRequest();
  cancelPendingAnalysisRequest();
  const preservedPendingEngineRequestId = gameState.pendingEngineRequestId;
  const preservedPendingAnalysisRequestId = gameState.pendingAnalysisRequestId;
  gameState = createInitialGameState();
  gameState.mode = preservedMode;
  gameState.localBottomSide = preservedLocalBottomSide;
  gameState.engineSide = preservedEngineSide;
  gameState.engineAvailable = preservedEngineAvailable;
  gameState.engineReady = preservedEngineReady;
  gameState.engineStatus = preservedEngineStatus;
  gameState.engineMoveTime = preservedEngineMoveTime;
  gameState.pendingEngineRequestId = preservedPendingEngineRequestId;
  gameState.pendingAnalysisRequestId = preservedPendingAnalysisRequestId;
  gameState.statusText =
    statusText ??
    (preservedMode === "engine" && preservedEngineAvailable
      ? `Pikafish 已就绪，你执${getSideLabel(getHumanSide())}。`
      : "红方先行，点击棋子开始对局。");

  render();

  if (gameState.engineAvailable && !isEngineTurn()) {
    void refreshPositionAnalysis();
  }
}

async function handleReset() {
  resetGame();

  if (isEngineTurn()) {
    await requestEngineMove("开局由 Pikafish 先行。");
  }
}

function cycleEngineMoveTime() {
  const currentIndex = ENGINE_TIME_OPTIONS.indexOf(gameState.engineMoveTime);
  const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % ENGINE_TIME_OPTIONS.length;
  gameState.engineMoveTime = ENGINE_TIME_OPTIONS[nextIndex];
  render();
}

function parseEngineInfo(infoLine) {
  if (!infoLine) {
    return null;
  }

  const tokens = infoLine.trim().split(/\s+/);
  const info = { raw: infoLine };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "depth") {
      info.depth = Number(tokens[index + 1]);
    }

    if (token === "time") {
      info.time = Number(tokens[index + 1]);
    }

    if (token === "nodes") {
      info.nodes = Number(tokens[index + 1]);
    }

    if (token === "score") {
      const scoreType = tokens[index + 1];
      const scoreValue = Number(tokens[index + 2]);

      if (scoreType === "cp") {
        info.scoreCp = scoreValue;
      }

      if (scoreType === "mate") {
        info.scoreMate = scoreValue;
      }
    }

    if (token === "pv") {
      info.pv = tokens.slice(index + 1);
      break;
    }
  }

  return info;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

async function syncEngineStatus({ silent = false } = {}) {
  try {
    const payload = await fetchJson("./api/engine/status", {
      method: "GET",
      cache: "no-store",
      headers: {},
    });

    gameState.engineAvailable = Boolean(payload.available);
    gameState.engineReady = Boolean(payload.ready);
    gameState.engineStatus = payload.message ?? (payload.available ? "Pikafish 已连接" : "未连接");

    if (!payload.available) {
      gameState.positionAnalysisInfo = null;
      gameState.analysisSeries = [];
    }

    if (!silent && !payload.available) {
      gameState.statusText =
        "没有检测到 Pikafish bridge，请从 ui 目录运行 `node server.js` 后再切换引擎模式。";
    }

    render();
    return gameState.engineAvailable;
  } catch (error) {
    gameState.engineAvailable = false;
    gameState.engineReady = false;
    gameState.engineStatus = "未连接";
    gameState.positionAnalysisInfo = null;
    gameState.analysisSeries = [];

    if (!silent) {
      gameState.statusText =
        "当前不是通过本地 bridge 打开的页面，引擎模式暂不可用。请运行 `node server.js`。";
    }

    render();
    return false;
  }
}

async function requestEngineAnalysis(movetime = gameState.engineMoveTime) {
  return fetchJson("./api/engine/bestmove", {
    method: "POST",
    body: JSON.stringify({
      moves: gameState.uciMoves,
      movetime,
    }),
  });
}

async function requestEngineMove(overrideStatus = null) {
  if (!gameState.engineAvailable || gameState.winner || !isEngineTurn()) {
    return;
  }

  cancelPendingEngineRequest();
  const requestId = gameState.pendingEngineRequestId;
  gameState.engineThinking = true;
  clearSelection();
  gameState.statusText = overrideStatus ?? "Pikafish 思考中...";
  render();

  try {
    const payload = await requestEngineAnalysis(gameState.engineMoveTime);
    if (requestId !== gameState.pendingEngineRequestId) {
      return;
    }

    gameState.engineThinking = false;
    gameState.engineStatus = payload.message ?? "Pikafish 已连接";

    if (!payload.bestmove || payload.bestmove === "(none)") {
      const humanSide = getHumanSide();
      gameState.winner = humanSide;
      gameState.statusText = `${gameState.engineStatus}：当前无合法着法，${getSideLabel(
        humanSide,
      )}获胜。`;
      render();
      return;
    }

    const move = uciToMove(payload.bestmove, gameState.pieces);
    if (!move) {
      throw new Error(`无法解析引擎着法 ${payload.bestmove}`);
    }

    const parsedInfo = parseEngineInfo(payload.rawInfo ?? null);
    performMove(move, {
      actor: "engine",
      uci: payload.bestmove,
      engineInfo: parsedInfo,
    });
  } catch (error) {
    if (requestId !== gameState.pendingEngineRequestId) {
      return;
    }

    gameState.engineThinking = false;
    gameState.engineAvailable = false;
    gameState.engineReady = false;
    gameState.engineStatus = "引擎请求失败";
    gameState.statusText = `Pikafish 请求失败：${error.message}`;
    render();
  }
}

async function handleHint() {
  if (gameState.winner || gameState.engineThinking) {
    return;
  }

  if (gameState.engineAvailable) {
    cancelPendingEngineRequest();
    const requestId = gameState.pendingEngineRequestId;
    gameState.engineThinking = true;
    gameState.statusText = "正在请求 Pikafish 提示...";
    render();

  try {
    const analysisTurn = gameState.turn;
    const payload = await requestEngineAnalysis(Math.min(gameState.engineMoveTime, 800));
    if (requestId !== gameState.pendingEngineRequestId) {
      return;
      }

      gameState.engineThinking = false;
      if (!payload.bestmove || payload.bestmove === "(none)") {
        gameState.statusText = "当前局面没有可用提示。";
        render();
        return;
      }

      const suggestedMove = uciToMove(payload.bestmove, gameState.pieces);
      if (!suggestedMove) {
        throw new Error(`无法解析提示着法 ${payload.bestmove}`);
      }

      const piece = applySuggestedMoveHint(suggestedMove, { selectPiece: true });
      if (!piece) {
        throw new Error(`无法定位提示着法 ${payload.bestmove}`);
      }
      gameState.lastEngineInfo = parseEngineInfo(payload.rawInfo ?? null);
      gameState.positionAnalysisInfo = buildTtxqAnalysis(gameState.lastEngineInfo, analysisTurn);
      upsertAnalysisSeries(gameState.positionAnalysisInfo);
      gameState.statusText = `Pikafish 建议：${formatChineseMoveNotation(piece, suggestedMove)}。`;
      render();
      return;
    } catch (error) {
      if (requestId !== gameState.pendingEngineRequestId) {
        return;
      }

      gameState.engineThinking = false;
      gameState.statusText = `请求引擎提示失败：${error.message}`;
      render();
      return;
    }
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

  const piece = applySuggestedMoveHint(suggestedMove, { selectPiece: true });
  gameState.statusText = `建议着法：${formatChineseMoveNotation(
    piece,
    suggestedMove,
  )}。`;
  render();
}

async function handleCommitMove(move) {
  const applied = performMove(move, {
    actor: "human",
    uci: moveToUci(move),
  });

  if (!applied) {
    return;
  }

  if (isEngineTurn()) {
    await requestEngineMove();
  }
}

async function handleIntersectionClick(x, y) {
  const boardMap = createBoardMap(gameState.pieces);
  const clickedPiece = getPieceAt(boardMap, x, y);

  if (clickedPiece) {
    setInspectorPiece(clickedPiece.id);
  }

  if (gameState.winner) {
    render();
    return;
  }

  if (gameState.engineThinking) {
    gameState.statusText = "Pikafish 正在思考，请稍候。";
    render();
    return;
  }

  if (clickedPiece && canSelectPiece(clickedPiece)) {
    if (gameState.selectedPieceId === clickedPiece.id) {
      clearSelection({ keepHint: shouldAutoSuggestMove() });
      gameState.statusText = `${getSideLabel(gameState.turn)}取消了当前选子。`;
      render();
      return;
    }

    selectPiece(clickedPiece.id);
    return;
  }

  if (
    clickedPiece &&
    gameState.mode === "engine" &&
    clickedPiece.side === gameState.engineSide &&
    !gameState.winner
  ) {
    clearSelection();
    gameState.statusText = `当前由 Pikafish 执${getSideLabel(gameState.engineSide)}。`;
    render();
    return;
  }

  const targetMove = getLegalMoveByTarget(x, y);
  if (targetMove) {
    await handleCommitMove(targetMove);
    return;
  }

  clearSelection({ keepHint: shouldAutoSuggestMove() });
  gameState.statusText = clickedPiece
    ? `现在轮到${getSideLabel(gameState.turn)}行棋。`
    : `${getSideLabel(gameState.turn)}行棋。`;
  render();
}

async function enableEngineMode() {
  const available = await syncEngineStatus({ silent: false });
  if (!available) {
    return;
  }

  gameState.mode = "engine";
  resetGame(`Pikafish 已连接，你执${getSideLabel(getHumanSide())}。`);

  if (isEngineTurn()) {
    await requestEngineMove("Pikafish 先手开局中...");
  }
}

function enableLocalMode() {
  gameState.mode = "local";
  resetGame("已切回本地双人模式。");
}

function toggleLocalBoardSide() {
  if (gameState.mode !== "local" || gameState.engineThinking) {
    return;
  }

  gameState.localBottomSide = getOppositeSide(gameState.localBottomSide);
  gameState.statusText = `已切换为${getSideLabel(gameState.localBottomSide)}在下视角。`;
  render();
}

async function toggleEngineSide() {
  if (gameState.mode !== "engine") {
    return;
  }

  gameState.engineSide = getOppositeSide(gameState.engineSide);
  resetGame(`已切换执棋方，你执${getSideLabel(getHumanSide())}。`);

  if (isEngineTurn()) {
    await requestEngineMove("Pikafish 先手开局中...");
  }
}

function renderPieces() {
  const fragment = document.createDocumentFragment();
  const lastMovedPieceId = gameState.lastMove?.pieceId ?? null;

  gameState.pieces.forEach((piece, index) => {
    const { left, top } = getPercentPosition(piece.x, piece.y);
    const button = document.createElement("button");
    const engineLocked =
      gameState.mode === "engine" &&
      gameState.engineAvailable &&
      piece.side === gameState.engineSide &&
      !gameState.winner;

    button.type = "button";
    button.className = [
      "piece",
      piece.side === "red" ? "piece-red" : "piece-black",
      piece.id === gameState.selectedPieceId ? "selected" : "",
      piece.id === lastMovedPieceId ? "last-moved" : "",
      engineLocked ? "engine-locked" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.style.left = `${left}%`;
    button.style.top = `${top}%`;
    button.style.animationDelay = `${index * 12}ms`;
    button.innerHTML = `<span>${piece.label}</span>`;
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await handleIntersectionClick(piece.x, piece.y);
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
    marker.addEventListener("click", async (event) => {
      event.stopPropagation();
      await handleCommitMove(move);
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

function renderHintArrow() {
  hideHintArrow();
}

function renderMoveList() {
  const fragment = document.createDocumentFragment();

  if (!gameState.history.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "move-item empty";
    emptyState.textContent =
      gameState.mode === "engine"
        ? "人机对战记录会在这里实时生成。"
        : "对局记录会在这里实时生成。";
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
        <div class="move-side">${entry.record.actorLabel} · ${entry.record.uci}</div>
      </div>
      <span class="move-side">${entry.record.outcomeText}</span>
    `;
    fragment.appendChild(item);
  });

  moveList.replaceChildren(fragment);
}

function renderAnalysisCard() {
  const analysis = gameState.positionAnalysisInfo;

  analysisVerdict.className = "analysis-pill";
  analysisTrendChart.className = "analysis-trend-chart";
  analysisTrendLine.className = "analysis-trend-line";
  analysisTrendDot.className = "analysis-trend-dot";

  if (!analysis) {
    analysisVerdict.classList.add("is-even");
    analysisVerdict.textContent = gameState.engineAvailable ? "等待分析" : "引擎离线";
    analysisScoreValue.textContent = "0";
    analysisRedValue.textContent = "红优 0";
    analysisRawValue.textContent = gameState.engineAvailable ? "原始 等待中" : "原始 不可用";
    analysisBlackValue.textContent = "黑优 0";
    analysisTrendSummary.textContent = gameState.engineAvailable ? "等待引擎分析" : "需要先连接引擎";
    analysisTrendLine.setAttribute("points", "");
    analysisTrendDot.setAttribute("r", "0");
    return;
  }

  analysisVerdict.classList.add(
    analysis.advantageSide === "red"
      ? "is-red"
      : analysis.advantageSide === "black"
        ? "is-black"
        : "is-even",
  );
  analysisTrendChart.classList.add(
    analysis.advantageSide === "red"
      ? "is-red"
      : analysis.advantageSide === "black"
        ? "is-black"
        : "is-even",
  );
  analysisTrendLine.classList.add(
    analysis.advantageSide === "red"
      ? "is-red"
      : analysis.advantageSide === "black"
        ? "is-black"
        : "is-even",
  );
  analysisTrendDot.classList.add(
    analysis.advantageSide === "red"
      ? "is-red"
      : analysis.advantageSide === "black"
        ? "is-black"
        : "is-even",
  );

  analysisVerdict.textContent = analysis.verdict;
  analysisScoreValue.textContent = analysis.scoreText;
  analysisRedValue.textContent = analysis.redLabel;
  analysisRawValue.textContent = analysis.rawDisplayLabel;
  analysisBlackValue.textContent = analysis.blackLabel;
  analysisTrendSummary.textContent = analysis.depth
    ? `${analysis.ttxqLabel} · 深度 ${analysis.depth}`
    : analysis.ttxqLabel;

  const series = gameState.analysisSeries.slice(-24);
  if (!series.length) {
    analysisTrendLine.setAttribute("points", "");
    analysisTrendDot.setAttribute("r", "0");
    return;
  }

  const width = 320;
  const height = 132;
  const padX = 10;
  const padY = 10;
  const zeroY = height / 2;
  const maxAbs = Math.max(
    333,
    ...series.map((entry) => Math.abs(entry.chartScore || 0)),
  );
  const range = maxAbs * 1.08;

  const pointObjects = series.map((entry, index) => {
    const x =
      series.length === 1
        ? width / 2
        : padX + (index * (width - padX * 2)) / (series.length - 1);
    const y = zeroY - ((entry.chartScore || 0) / range) * (zeroY - padY);
    return {
      x,
      y,
    };
  });

  const points = pointObjects
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const lastPoint = pointObjects.at(-1) ?? { x: width / 2, y: zeroY };

  analysisTrendLine.setAttribute("points", points);
  analysisTrendDot.setAttribute("cx", lastPoint.x.toFixed(1));
  analysisTrendDot.setAttribute("cy", lastPoint.y.toFixed(1));
  analysisTrendDot.setAttribute("r", "4.5");
}

function renderOverview() {
  const currentLegalMoves = gameState.winner
    ? []
    : getAllLegalMoves(gameState.turn, gameState.pieces);
  const humanSide = getHumanSide();
  const localBottomLabel = getSideLabel(gameState.localBottomSide);

  gameStatePill.classList.remove("is-busy", "is-error");

  if (gameState.mode === "engine" && !gameState.engineAvailable) {
    gameStatePill.textContent = "引擎离线";
    gameStatePill.classList.add("is-error");
  } else if (gameState.engineThinking) {
    gameStatePill.textContent = "Pikafish 思考中";
    gameStatePill.classList.add("is-busy");
  } else if (gameState.winner) {
    gameStatePill.textContent = "对局结束";
  } else if (gameState.mode === "engine") {
    gameStatePill.textContent = "Pikafish 已连接";
  } else if (gameState.checkSide) {
    gameStatePill.textContent = "将军";
  } else {
    gameStatePill.textContent = "本地对弈";
  }

  phaseLabel.textContent =
    gameState.mode === "engine"
      ? `人机对战 · 你执${getSideLabel(humanSide)}`
      : `双人同屏 · ${localBottomLabel}在下 · 已吃 ${initialPieces.length - gameState.pieces.length} 子`;

  turnStrip.textContent = gameState.winner
    ? `${getSideLabel(gameState.winner)}胜利`
    : gameState.engineThinking
      ? `Pikafish 执${getSideLabel(gameState.engineSide)}思考中`
      : `${getSideLabel(gameState.turn)}行棋`;

  if (gameState.positionAnalysisInfo) {
    evalChip.textContent = gameState.positionAnalysisInfo.ttxqLabel;
  } else if (gameState.mode === "engine") {
    evalChip.textContent = formatEngineInfoShort(gameState.lastEngineInfo) || gameState.engineStatus;
  } else {
    evalChip.textContent = gameState.checkSide
      ? `${getSideLabel(gameState.checkSide)}被将军`
      : `${getSideLabel(gameState.turn)}先手中`;
  }

  gameTitle.textContent = gameState.mode === "engine" ? "Pikafish 人机对战" : "本地双人对弈";
  currentDescription.textContent = gameState.statusText;
  currentStepEl.textContent = String(gameState.history.length);
  turnLabel.textContent = gameState.winner
    ? `${getSideLabel(gameState.winner)}获胜`
    : getSideLabel(gameState.turn);

  if (gameState.hintTarget) {
    const hintNotation = getHintNotation();
    engineSuggestion.textContent = hintNotation ? `最佳着法：${hintNotation}` : "最佳着法已生成";
    return;
  }

  if (gameState.selectedPieceId) {
    const selectedPiece = getPieceById(gameState.pieces, gameState.selectedPieceId);
    engineSuggestion.textContent = `${selectedPiece.label} 可走 ${gameState.legalMoves.length} 步`;
    return;
  }

  if (gameState.positionAnalysisInfo) {
    const depthText = gameState.positionAnalysisInfo.depth
      ? ` · 深度 ${gameState.positionAnalysisInfo.depth}`
      : "";
    engineSuggestion.textContent = `${gameState.positionAnalysisInfo.ttxqLabel} · ${gameState.positionAnalysisInfo.rawDisplayLabel}${depthText}`;
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
  const bottomSide =
    gameState.mode === "engine" ? getHumanSide() ?? "red" : gameState.localBottomSide;
  const topSide = getOppositeSide(bottomSide);

  function applySlot(card, avatarEl, sideEl, nameEl, tagEl, side) {
    const isEngineSeat = gameState.mode === "engine" && side === gameState.engineSide;
    const isHumanSeat = gameState.mode === "engine" && side === getHumanSide();

    card.classList.toggle("is-active", activeSide === side);
    card.classList.toggle("is-in-check", gameState.checkSide === side);

    avatarEl.classList.toggle("avatar-red", side === "red");
    avatarEl.classList.toggle("avatar-dark", side === "black");
    avatarEl.textContent = side === "red" ? "红" : "黑";
    sideEl.textContent = getSideLabel(side);
    tagEl.classList.toggle("rank-chip-red", side === "red");

    if (isEngineSeat) {
      nameEl.textContent = "Pikafish Engine";
      tagEl.textContent = "UCI · NNUE";
      return;
    }

    if (isHumanSeat) {
      nameEl.textContent = "本地玩家";
      tagEl.textContent = "你";
      return;
    }

    nameEl.textContent = side === "black" ? "云隐棋手" : "流火棋馆";
    tagEl.textContent = side === "black" ? "大师 2341" : "宗师 2478";
  }

  applySlot(playerBlackCard, topPlayerAvatar, topPlayerSide, blackPlayerName, blackPlayerTag, topSide);
  applySlot(playerRedCard, bottomPlayerAvatar, bottomPlayerSide, redPlayerName, redPlayerTag, bottomSide);
}

function renderButtons() {
  undoBtn.disabled = !gameState.history.length || gameState.engineThinking;
  hintBtn.disabled = Boolean(gameState.winner) || gameState.engineThinking;

  resetBtn.classList.toggle("is-loading", gameState.engineThinking);
  resetBtn.textContent = gameState.engineThinking ? "引擎思考中" : "重新开局";
  hintBtn.textContent = gameState.engineAvailable ? "引擎提示" : "提示着法";

  localModeBtn.classList.toggle("is-active", gameState.mode === "local");
  localFlipBtn.textContent =
    gameState.mode === "local"
      ? `${getSideLabel(gameState.localBottomSide)}在下`
      : "引擎自动视角";
  localFlipBtn.classList.toggle(
    "is-active",
    gameState.mode === "local" && gameState.localBottomSide === "black",
  );
  localFlipBtn.disabled = gameState.mode !== "local" || gameState.engineThinking;
  engineModeBtn.classList.toggle("is-active", gameState.mode === "engine");
  engineModeBtn.classList.toggle("is-accent", gameState.mode === "engine" && gameState.engineAvailable);

  engineSideBtn.textContent = `我执${getHumanSide() ? getSideLabel(getHumanSide()) : "红"}`;
  engineTimeBtn.textContent = getEngineTimeLabel();
  engineSideBtn.disabled = gameState.mode !== "engine" || gameState.engineThinking;
  engineTimeBtn.disabled = gameState.mode !== "engine" || gameState.engineThinking;
}

function render() {
  updateInspector();
  renderPieces();
  renderLegalMoves();
  renderMoveHighlight();
  renderHintArrow();
  renderMoveList();
  renderAnalysisCard();
  renderOverview();
  renderPlayerCards();
  renderButtons();
}

boardSurface.addEventListener("click", async (event) => {
  const point = getBoardCoordinateFromEvent(event);
  if (!point) {
    return;
  }

  await handleIntersectionClick(point.x, point.y);
});

undoBtn.addEventListener("click", handleUndo);
resetBtn.addEventListener("click", async () => {
  await handleReset();
});
hintBtn.addEventListener("click", async () => {
  await handleHint();
});

localModeBtn.addEventListener("click", () => {
  enableLocalMode();
});

localFlipBtn.addEventListener("click", () => {
  toggleLocalBoardSide();
});

engineModeBtn.addEventListener("click", async () => {
  await enableEngineMode();
});

engineSideBtn.addEventListener("click", async () => {
  await toggleEngineSide();
});

engineTimeBtn.addEventListener("click", () => {
  cycleEngineMoveTime();
});

themeSwitch.addEventListener("click", () => {
  document.body.classList.toggle("theme-jade");
  const isJade = document.body.classList.contains("theme-jade");
  themeSwitch.textContent = isJade ? "切回木纹主题" : "切换玉石主题";
});

render();

window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});

window.addEventListener("load", async () => {
  const available = await syncEngineStatus({ silent: true });
  if (available) {
    gameState.mode = "engine";
    gameState.statusText = `Pikafish 已连接，你执${getSideLabel(getHumanSide())}。`;
    render();

    if (isEngineTurn()) {
      await requestEngineMove("Pikafish 先手开局中...");
    } else {
      await refreshPositionAnalysis();
    }
  } else {
    gameState.mode = "local";
    gameState.statusText = "未检测到 Pikafish bridge，已回退到本地双人模式。";
    render();
  }
});
