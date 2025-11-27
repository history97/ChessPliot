import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard as Board } from "react-chessboard";
import { toast, ToastContainer } from "react-toastify";
import ThemeSelector from "./ThemeSelector";
import TurnDisplay from "./TurnDisplay";
import CapturedPieces from "./CapturedPieces";
import DarkModeToggle from "./DarkModeToggle";
import "../styles/Chessboard.css";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { saveReplayToLocal } from "../utils/replayStorage";
import { saveReplay } from "../utils/idb";

export default function ChessboardComponent() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const fenHistoryRef = useRef([game.fen()]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highlightSquares, setHighlightSquares] = useState({});
  const [theme, setTheme] = useState("classic");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [aiLevel, setAiLevel] = useState(5);
  const stockfishRef = useRef(null);
  const navigate = useNavigate();
  const [aiThinking, setAiThinking] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [pendingReplay, setPendingReplay] = useState(null);
  const [replayTitle, setReplayTitle] = useState("");

  useEffect(() => {
    const stockfish = new Worker("/stockfish-17.1-8e4d048.js");
    stockfishRef.current = stockfish;

    stockfish.postMessage("uci");
    stockfish.postMessage("isready");

    stockfish.onmessage = (event) => {
      const line = event.data;
      if (typeof line === "string" && line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);

        setGame((prevGame) => {
          const tempGame = new Chess(prevGame.fen());
          const legalMoves = tempGame.moves({ verbose: true });
          const isLegal = legalMoves.some(
            (m) => m.from === from && m.to === to
          );
          if (!isLegal) return prevGame;

          const result = tempGame.move({ from, to, promotion: "q" });
          if (!result) return prevGame;

          setFen(tempGame.fen());
          setTurnCount((prev) => prev + 1);
          fenHistoryRef.current.push(tempGame.fen());
          saveReplayToLocal(fenHistoryRef.current);
          setAiThinking(false);

          if (result.captured) {
            const captured = result.captured.toUpperCase();
            if (result.color === "w")
              setCapturedBlack((prev) => [...prev, captured]);
            else setCapturedWhite((prev) => [...prev, captured]);
          }

          setSelectedSquare(null);
          setHighlightSquares({});
          checkGameEnd(tempGame);
          return tempGame;
        });
      }
    };

    return () => stockfish.terminate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark-mode");
    else root.classList.remove("dark-mode");
  }, [isDark]);

  function checkGameEnd(tempGame) {
    if (tempGame.isCheck()) {
      toast.warning("⚠️ 체크 상태입니다!");
    }

    if (tempGame.isCheckmate()) {
      toast.success("✅ 체크메이트! 승리!");

      const finalFen = tempGame.fen();
      const lastFen = fenHistoryRef.current[fenHistoryRef.current.length - 1];
      if (finalFen !== lastFen) {
        fenHistoryRef.current.push(finalFen);
      }

      const replayData = {
        id: `replay-${Date.now()}`,
        fenHistory: [...fenHistoryRef.current],
        startedAt: new Date().toISOString(),
      };

      setPendingReplay(replayData);
      setShowSaveModal(true);
    } else if (tempGame.isStalemate()) {
      toast.info("😐 스테일메이트입니다.");
      setIsGameOver(true);
    }
  }

  function requestAIMove(currentGame) {
    const stockfish = stockfishRef.current;
    if (!stockfish) return;

    const fen = currentGame.fen();
    const depth = Math.floor(aiLevel * 2) + 3;

    stockfish.postMessage("stop");
    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage("setoption name Skill Level value 5");
    stockfish.postMessage("setoption name MultiPV value 1");
    stockfish.postMessage("setoption name Threads value 1");
    stockfish.postMessage("setoption name Hash value 16");
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go depth ${depth}`);
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsGameOver(false);
    setHighlightSquares({});
    setSelectedSquare(null);
    setTurnCount(0);
    setCapturedWhite([]);
    setCapturedBlack([]);
    fenHistoryRef.current = [newGame.fen()];
    toast.info("🔄 게임이 초기화되었습니다.");
  }

  function shouldPromote(from, to) {
    const piece = game.get(from);
    if (!piece || piece.type !== "p") return false;
    const isWhite = piece.color === "w";
    const targetRank = to[1];
    return (isWhite && targetRank === "8") || (!isWhite && targetRank === "1");
  }

  function onSquareClick(square) {
    if (isGameOver) return;

    const piece = game.get(square);
    if (!selectedSquare) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) {
        setHighlightSquares({});
        return;
      }
      const highlights = {};
      moves.forEach((move) => {
        const isSpecial =
          move.flags.includes("k") ||
          move.flags.includes("q") ||
          move.flags.includes("e");
        highlights[move.to] = {
          backgroundColor: isSpecial ? "#00ccff44" : "#00ff0044",
        };
      });
      highlights[square] = {
        ...highlights[square],
        boxShadow: "inset 0 0 0 3px #ff0000",
      };
      setSelectedSquare(square);
      setHighlightSquares(highlights);
      return;
    }

    const tempGame = new Chess(game.fen());
    let moveResult;
    try {
      moveResult = tempGame.move({
        from: selectedSquare,
        to: square,
        promotion: shouldPromote(selectedSquare, square) ? "q" : undefined,
      });
      if (!moveResult) throw new Error("invalid move");
    } catch (err) {
      toast.error("❌ 유효하지 않은 이동입니다!");
      setSelectedSquare(null);
      setHighlightSquares({});
      return;
    }

    if (moveResult.flags.includes("k") || moveResult.flags.includes("q"))
      toast.info("🏰 캐슬링이 실행되었습니다!");

    if (moveResult.captured) {
      const captured = moveResult.captured.toUpperCase();
      if (moveResult.color === "w")
        setCapturedBlack((prev) => [...prev, captured]);
      else setCapturedWhite((prev) => [...prev, captured]);
    }

    setFen(tempGame.fen());
    setTurnCount((prev) => prev + 1);
    fenHistoryRef.current.push(tempGame.fen());
    saveReplayToLocal(fenHistoryRef.current);

    setGame(tempGame);
    setSelectedSquare(null);
    setHighlightSquares({});
    checkGameEnd(tempGame);

    if (!tempGame.isGameOver() && tempGame.turn() === "b" && !aiThinking) {
      setAiThinking(true);
      setTimeout(() => requestAIMove(tempGame), 700);
    }
  }

  function handleConfirmSave() {
    setShowSaveModal(false);
    setShowTitleModal(true);
  }

  async function handleTitleSubmit() {
    if (!pendingReplay) return;
    try {
      await saveReplay(pendingReplay.id, pendingReplay.fenHistory, replayTitle);
      toast.success("✅ 리플레이가 저장되었습니다.");
      console.log("✅ 저장됨:", pendingReplay.id, replayTitle);
    } catch (err) {
      toast.error("❌ 저장 실패");
      console.error("❌ 저장 실패:", err);
    }
    setPendingReplay(null);
    setShowTitleModal(false);
    setIsGameOver(true);
  }

  const customPieces = {
    wK: () => (
      <img
        src="/pieces/wK.svg"
        alt="wK"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    wQ: () => (
      <img
        src="/pieces/wQ.svg"
        alt="wQ"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    wR: () => (
      <img
        src="/pieces/wR.svg"
        alt="wR"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    wB: () => (
      <img
        src="/pieces/wB.svg"
        alt="wB"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    wN: () => (
      <img
        src="/pieces/wN.svg"
        alt="wN"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    wP: () => (
      <img
        src="/pieces/wP.svg"
        alt="wP"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bK: () => (
      <img
        src="/pieces/bK.svg"
        alt="bK"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bQ: () => (
      <img
        src="/pieces/bQ.svg"
        alt="bQ"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bR: () => (
      <img
        src="/pieces/bR.svg"
        alt="bR"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bB: () => (
      <img
        src="/pieces/bB.svg"
        alt="bB"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bN: () => (
      <img
        src="/pieces/bN.svg"
        alt="bN"
        style={{ width: "100%", height: "100%" }}
      />
    ),
    bP: () => (
      <img
        src="/pieces/bP.svg"
        alt="bP"
        style={{ width: "100%", height: "100%" }}
      />
    ),
  };

  return (
    <div className="chessboard-container">
      {/* ✅ 저장 여부 모달 */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p style={{ color: "#000" }}>방금 경기를 저장하시겠습니까?</p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "12px",
                justifyContent: "center",
              }}
            >
              <button onClick={handleConfirmSave} className="menu-button">
                예
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setPendingReplay(null);
                  toast.info("❌ 리플레이를 생성하지 않았습니다.");
                  setIsGameOver(true);
                }}
                className="menu-button"
                style={{ background: "#a71d2a" }}
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 제목 입력 모달 */}
      {showTitleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p style={{ color: "#000" }}>리플레이 제목을 입력하세요:</p>
            <input
              type="text"
              value={replayTitle}
              onChange={(e) => setReplayTitle(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid var(--accent)",
                marginTop: "12px",
                width: "80%",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "16px",
                justifyContent: "center",
              }}
            >
              <button onClick={handleTitleSubmit} className="menu-button">
                저장
              </button>
              <button
                onClick={() => {
                  setShowTitleModal(false);
                  setPendingReplay(null);
                  toast.info("❌ 리플레이를 생성하지 않았습니다.");
                  setIsGameOver(true);
                }}
                className="menu-button"
                style={{ background: "#a71d2a" }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-panel">
        <ThemeSelector theme={theme} setTheme={setTheme} />
        <DarkModeToggle isDark={isDark} setIsDark={setIsDark} />
        <label className="ai-level-selector">
          <span>🤖 AI 난이도:</span>
          <label className="ai-slider-label">AI 난이도: {aiLevel}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={aiLevel}
            onChange={(e) => setAiLevel(Number(e.target.value))}
            className="ai-slider"
          />
        </label>
      </div>

      <div className="board-side">
        <Board
          position={fen}
          onSquareClick={onSquareClick}
          customSquareStyles={highlightSquares}
          customPieces={customPieces}
          boardWidth={500}
          arePiecesDraggable={false}
        />
        <TurnDisplay turn={game.turn()} turnCount={turnCount} />
        <button onClick={resetGame} className="reset-button">
          게임 리셋
        </button>
        <div className="menu-buttons-row">
          <button className="menu-button" onClick={() => navigate("/")}>
            🏠 메인화면으로
          </button>
          <button className="menu-button" onClick={() => navigate("/replay")}>
            🎥 리플레이 관전하기
          </button>
        </div>
      </div>

      <CapturedPieces
        capturedWhite={capturedWhite}
        capturedBlack={capturedBlack}
      />
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
