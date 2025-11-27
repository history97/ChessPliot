import React, { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { database } from "../utils/firebase";
import { ref, set, onValue, get, remove, update } from "firebase/database";
import { saveReplay } from "../utils/idb";
import "react-toastify/dist/ReactToastify.css";
import "../styles/PVPMode.css";
import "../styles/PVPModeAdditions.css";

export default function PVPMode() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("menu");
  const [game, setGame] = useState(new Chess());
  const [currentFen, setCurrentFen] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState("white");
  const [roomCode, setRoomCode] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [fenHistory, setFenHistory] = useState([game.fen()]);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [gameStartTime, setGameStartTime] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightSquares, setHighlightSquares] = useState({});
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true);
  const [resetRequest, setResetRequest] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [pendingReplay, setPendingReplay] = useState(null);
  const [replayTitle, setReplayTitle] = useState("");
  
  const hasJoinedRef = useRef(false);
  const lastResetTimestampRef = useRef(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!database) {
          console.warn("⚠️ Firebase가 초기화되지 않았습니다.");
          setIsFirebaseAvailable(false);
          toast.info("🏠 로컬 PVP 모드만 사용 가능합니다.", { autoClose: 5000 });
          return;
        }
        setIsFirebaseAvailable(true);
        console.log("✅ PVPMode에서 Firebase 연결 확인 완료!");
      } catch (error) {
        console.error("Firebase 연결 실패:", error.message);
        setIsFirebaseAvailable(false);
      }
    };
    testConnection();
  }, []);

  function startLocalPVP() {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentFen(newGame.fen());
    setFenHistory([newGame.fen()]);
    setCapturedPieces({ white: [], black: [] });
    setPlayerColor("white");
    setGameStartTime(Date.now());
    setMode("playing");
    setRoomCode("LOCAL");
    toast.success("🎮 로컬 PVP 게임이 시작되었습니다!");
  }

  async function createOnlineRoom() {
    if (!database || !isFirebaseAvailable) {
      toast.error("❌ Firebase 연결이 필요합니다!");
      return;
    }

    if (!playerName.trim()) {
      toast.error("❌ 플레이어 이름을 입력해주세요!");
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setPlayerColor("white");
    setMode("create");
    
    try {
      const roomRef = ref(database, `rooms/${code}`);
      await set(roomRef, {
        code: code,
        host: playerName.trim(),
        hostColor: "white",
        game: game.fen(),
        fenHistory: [game.fen()],
        capturedPieces: { white: [], black: [] },
        createdAt: Date.now(),
        status: "waiting",
        opponent: null,
        resetRequest: null
      });
      
      toast.success(`🎉 방이 생성되었습니다! 코드: ${code}`);
      hasJoinedRef.current = false;
    } catch (error) {
      console.error("방 생성 오류:", error);
      toast.error("❌ 방 생성에 실패했습니다.");
    }
  }

  async function joinOnlineRoom() {
    if (!database || !isFirebaseAvailable) {
      toast.error("❌ Firebase 연결이 필요합니다!");
      return;
    }

    if (!inputRoomCode.trim() || !playerName.trim()) {
      toast.error("❌ 이름과 방 코드를 입력해주세요!");
      return;
    }

    const code = inputRoomCode.toUpperCase();
    
    try {
      const roomRef = ref(database, `rooms/${code}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        toast.error("❌ 존재하지 않는 방입니다!");
        return;
      }

      const roomData = snapshot.val();
      
      if (roomData.opponent) {
        toast.error("❌ 이미 가득 찬 방입니다!");
        return;
      }

      if (roomData.status !== "waiting") {
        toast.error("❌ 참가할 수 없는 방입니다!");
        return;
      }

      await update(roomRef, {
        opponent: playerName.trim(),
        status: "playing"
      });

      setRoomCode(code);
      setPlayerColor("black");
      setOpponentName(roomData.host);
      
      const newGame = new Chess(roomData.game);
      setGame(newGame);
      setCurrentFen(newGame.fen());
      setFenHistory(roomData.fenHistory || [roomData.game]);
      setCapturedPieces(roomData.capturedPieces || { white: [], black: [] });
      setGameStartTime(Date.now());
      setMode("playing");
      
      toast.success("🎮 방에 참가했습니다!");
    } catch (error) {
      console.error("방 참가 오류:", error);
      toast.error("❌ 방 참가에 실패했습니다.");
    }
  }

  useEffect(() => {
    if (mode === "create" && roomCode && isFirebaseAvailable) {
      const roomRef = ref(database, `rooms/${roomCode}`);
      
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.opponent && data.status === "playing" && !hasJoinedRef.current) {
          setOpponentName(data.opponent);
          setMode("playing");
          setGameStartTime(Date.now());
          toast.success(`🎉 ${data.opponent}님이 입장했습니다!`);
          hasJoinedRef.current = true;
        }
      });

      return () => unsubscribe();
    }
  }, [mode, roomCode, isFirebaseAvailable]);

  useEffect(() => {
    if (mode === "playing" && roomCode && roomCode !== "LOCAL" && isFirebaseAvailable) {
      const roomRef = ref(database, `rooms/${roomCode}`);
      
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
          toast.error("❌ 방이 삭제되었습니다.");
          setMode("menu");
          return;
        }

        if (data.resetRequest && data.resetRequest.from !== playerName && data.resetRequest.status === "pending") {
          setResetRequest(data.resetRequest);
        }

        if (data.resetRequest && data.resetRequest.status === "accepted") {
          if (data.resetRequest.timestamp !== lastResetTimestampRef.current) {
            lastResetTimestampRef.current = data.resetRequest.timestamp;
            const newGame = new Chess();
            setGame(newGame);
            setCurrentFen(newGame.fen());
            setFenHistory([newGame.fen()]);
            setCapturedPieces({ white: [], black: [] });
            setResetRequest(null);
            toast.success("🔄 새 게임이 시작되었습니다!");
            
            setTimeout(() => {
              update(roomRef, { resetRequest: null });
            }, 1000);
          }
        }

        if (data.resetRequest && data.resetRequest.from === playerName && data.resetRequest.status === "rejected") {
          toast.error("❌ 상대방이 새 게임을 거절했습니다.");
          setResetRequest(null);
          update(roomRef, { resetRequest: null });
        }

        if (data.game !== currentFen) {
          const newGame = new Chess(data.game);
          setGame(newGame);
          setCurrentFen(data.game);
          setFenHistory(data.fenHistory || [data.game]);
          setCapturedPieces(data.capturedPieces || { white: [], black: [] });
        }

        if (data.status === "finished") {
          toast.info("🏁 게임이 종료되었습니다.");
        }
      });

      return () => unsubscribe();
    }
  }, [mode, roomCode, currentFen, isFirebaseAvailable, playerName]);

  const updateGameState = useCallback(async (newFen, newFenHistory, newCapturedPieces) => {
    if (roomCode && roomCode !== "LOCAL" && isFirebaseAvailable) {
      try {
        const roomRef = ref(database, `rooms/${roomCode}`);
        await update(roomRef, {
          game: newFen,
          fenHistory: newFenHistory,
          capturedPieces: newCapturedPieces,
          lastMove: Date.now()
        });
      } catch (error) {
        console.error("게임 상태 업데이트 오류:", error);
        toast.error("❌ 게임 상태 업데이트에 실패했습니다.");
      }
    }
  }, [roomCode, isFirebaseAvailable]);

  function onSquareClick(square) {
    if (roomCode !== "LOCAL") {
      const isMyTurn = (game.turn() === 'w' && playerColor === 'white') || 
                       (game.turn() === 'b' && playerColor === 'black');
      if (!isMyTurn) {
        toast.warning("⏳ 상대방의 차례입니다!");
        return;
      }
    }

    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && ((game.turn() === 'w' && piece.color === 'w') || 
                    (game.turn() === 'b' && piece.color === 'b'))) {
        setSelectedSquare(square);
        
        const possibleMoves = game.moves({ square, verbose: true });
        const highlights = {};
        highlights[square] = { background: 'rgba(255, 255, 0, 0.5)' };
        
        possibleMoves.forEach(move => {
          highlights[move.to] = { 
            background: 'rgba(0, 255, 0, 0.4)'
          };
        });
        
        setHighlightSquares(highlights);
      }
    } else {
      makeMove(selectedSquare, square);
      setSelectedSquare(null);
      setHighlightSquares({});
    }
  }

  async function makeMove(from, to) {
    try {
      const move = game.move({ from, to, promotion: 'q' });
      
      if (move) {
        const newCapturedPieces = { ...capturedPieces };
        if (move.captured) {
          const capturedBy = move.color === 'w' ? 'white' : 'black';
          if (!newCapturedPieces[capturedBy]) {
            newCapturedPieces[capturedBy] = [];
          }
          newCapturedPieces[capturedBy] = [...newCapturedPieces[capturedBy], move.captured];
          setCapturedPieces(newCapturedPieces);
        }
        
        const newFen = game.fen();
        const newFenHistory = [...fenHistory, newFen];
        setCurrentFen(newFen);
        setFenHistory(newFenHistory);
        
        await updateGameState(newFen, newFenHistory, newCapturedPieces);
        checkGameStatus();
      } else {
        toast.error("❌ 잘못된 수입니다!");
      }
    } catch (error) {
      toast.error("❌ 이동할 수 없습니다!");
    }
  }

  async function checkGameStatus() {
    let gameFinished = false;
    
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? '흑' : '백';
      toast.success(`🏆 ${winner}이 승리했습니다! 체크메이트!`);
      gameFinished = true;
      
      // 리플레이 저장 여부를 물어봄
      const replayData = {
        id: `pvp-${Date.now()}`,
        fenHistory: [...fenHistory],
        defaultTitle: roomCode === "LOCAL" ? "로컬 PVP 게임" : `온라인 PVP - ${roomCode}`
      };
      setPendingReplay(replayData);
      setShowSaveModal(true);
      
    } else if (game.isDraw()) {
      toast.info("🤝 무승부입니다!");
      gameFinished = true;
      
      const replayData = {
        id: `pvp-${Date.now()}`,
        fenHistory: [...fenHistory],
        defaultTitle: roomCode === "LOCAL" ? "로컬 PVP (무승부)" : `온라인 PVP - ${roomCode} (무승부)`
      };
      setPendingReplay(replayData);
      setShowSaveModal(true);
    } else if (game.isStalemate()) {
      toast.info("🤝 스테일메이트! 무승부입니다!");
      gameFinished = true;
      
      const replayData = {
        id: `pvp-${Date.now()}`,
        fenHistory: [...fenHistory],
        defaultTitle: roomCode === "LOCAL" ? "로컬 PVP (스테일메이트)" : `온라인 PVP - ${roomCode} (스테일메이트)`
      };
      setPendingReplay(replayData);
      setShowSaveModal(true);
    } else if (game.inCheck()) {
      toast.warning("⚠️ 체크!");
    }

    if (gameFinished && roomCode !== "LOCAL" && isFirebaseAvailable) {
      try {
        const roomRef = ref(database, `rooms/${roomCode}`);
        await update(roomRef, {
          status: "finished",
          finishedAt: Date.now()
        });
      } catch (error) {
        console.error("게임 종료 상태 업데이트 오류:", error);
      }
    }
  }

  async function requestResetGame() {
    if (playerColor !== "white") {
      toast.error("❌ 호스트만 새 게임을 시작할 수 있습니다!");
      return;
    }

    if (roomCode === "LOCAL") {
      const newGame = new Chess();
      setGame(newGame);
      setCurrentFen(newGame.fen());
      setFenHistory([newGame.fen()]);
      setCapturedPieces({ white: [], black: [] });
      setGameStartTime(Date.now());
      toast.success("🔄 게임이 리셋되었습니다!");
      return;
    }

    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      await update(roomRef, {
        resetRequest: {
          from: playerName,
          status: "pending",
          timestamp: Date.now()
        }
      });
      toast.info("⏳ 상대방의 응답을 기다리는 중...");
    } catch (error) {
      console.error("새 게임 요청 오류:", error);
      toast.error("❌ 새 게임 요청에 실패했습니다.");
    }
  }

  async function acceptResetRequest() {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const newGame = new Chess();
      
      await update(roomRef, {
        game: newGame.fen(),
        fenHistory: [newGame.fen()],
        capturedPieces: { white: [], black: [] },
        resetRequest: {
          ...resetRequest,
          status: "accepted"
        }
      });
      
      setResetRequest(null);
    } catch (error) {
      console.error("새 게임 수락 오류:", error);
      toast.error("❌ 새 게임 수락에 실패했습니다.");
    }
  }

  async function rejectResetRequest() {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      await update(roomRef, {
        resetRequest: {
          ...resetRequest,
          status: "rejected"
        }
      });
      setResetRequest(null);
      toast.info("거절했습니다.");
    } catch (error) {
      console.error("새 게임 거절 오류:", error);
    }
  }

  async function leaveRoom() {
    if (roomCode && roomCode !== "LOCAL" && isFirebaseAvailable) {
      try {
        const roomRef = ref(database, `rooms/${roomCode}`);
        
        if (playerColor === "white") {
          await remove(roomRef);
          toast.info("🚪 방을 나갔습니다.");
        } else {
          await update(roomRef, {
            opponent: null,
            status: "waiting"
          });
          toast.info("🚪 게임에서 나갔습니다.");
        }
      } catch (error) {
        console.error("방 나가기 오류:", error);
      }
    }
    
    setMode("menu");
    setRoomCode("");
    setPlayerColor("white");
    setFenHistory([new Chess().fen()]);
    setCapturedPieces({ white: [], black: [] });
    setOpponentName("");
    hasJoinedRef.current = false;
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode);
    toast.success("📋 방 코드가 복사되었습니다!");
  }

  function handleConfirmSave() {
    setShowSaveModal(false);
    setReplayTitle(pendingReplay.defaultTitle);
    setShowTitleModal(true);
  }

  async function handleTitleSubmit() {
    if (!pendingReplay) return;
    try {
      await saveReplay(pendingReplay.id, pendingReplay.fenHistory, replayTitle || pendingReplay.defaultTitle);
      toast.success("✅ 리플레이가 저장되었습니다!");
      console.log("✅ 저장됨:", pendingReplay.id, replayTitle);
    } catch (err) {
      toast.error("❌ 저장 실패");
      console.error("❌ 저장 실패:", err);
    }
    setPendingReplay(null);
    setShowTitleModal(false);
    setReplayTitle("");
  }

  const pieceSymbols = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
    k: '♚'
  };

  if (mode === "menu") {
    return (
      <div className="pvp-container">
        <h2 className="pvp-title">🧑‍🤝‍🧑 PVP 모드</h2>
        
        {!isFirebaseAvailable && (
          <div className="firebase-warning">
            ⚠️ Firebase 설정이 필요합니다. 현재는 로컬 모드만 사용 가능합니다.
          </div>
        )}
        
        <div className="pvp-menu">
          <div className="pvp-card">
            <div className="pvp-card-icon">🖥️</div>
            <h3>로컬 PVP</h3>
            <p>같은 기기에서 두 명이 번갈아가며 플레이</p>
            <button className="pvp-button primary" onClick={startLocalPVP}>
              🎮 로컬 게임 시작
            </button>
          </div>

          <div className="pvp-card">
            <div className="pvp-card-icon">🌐</div>
            <h3>온라인 PVP</h3>
            <p>방을 만들고 친구를 초대하세요</p>
            <input
              type="text"
              className="player-name-input"
              placeholder="이름을 입력하세요"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button 
              className="pvp-button success" 
              onClick={createOnlineRoom}
              disabled={!isFirebaseAvailable}
            >
              ➕ 방 만들기
            </button>
          </div>

          <div className="pvp-card">
            <div className="pvp-card-icon">🚪</div>
            <h3>방 참가</h3>
            <p>친구가 공유한 코드로 입장</p>
            <div className="input-group">
              <input
                type="text"
                className="player-name-input"
                placeholder="이름을 입력하세요"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <input
                type="text"
                placeholder="방 코드 입력"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button 
                className="pvp-button info" 
                onClick={joinOnlineRoom}
                disabled={!isFirebaseAvailable}
              >
                🔗 참가하기
              </button>
            </div>
          </div>
        </div>

        <button className="back-button" onClick={() => navigate("/")}>
          🏠 메인화면으로
        </button>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="pvp-container">
        <h2 className="pvp-title">⏳ 상대 대기 중...</h2>
        
        <div className="waiting-room">
          <div className="room-code-display">
            <h3>방 코드</h3>
            <div className="code-box">
              <span className="code">{roomCode}</span>
              <button className="copy-btn" onClick={copyRoomCode}>
                📋 복사
              </button>
            </div>
            <p className="hint">친구에게 이 코드를 공유하세요!</p>
            <p className="player-info">🎮 {playerName}님이 대기 중...</p>
          </div>

          <div className="waiting-animation">
            <div className="spinner"></div>
            <p>상대방이 입장하기를 기다리는 중...</p>
          </div>

          <button className="back-button" onClick={leaveRoom}>
            ❌ 취소
          </button>
        </div>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    );
  }

  return (
    <div className="pvp-container">
      <div className="pvp-game-header">
        <h2 className="pvp-title">
          {roomCode === "LOCAL" ? "🖥️ 로컬 PVP" : `🌐 온라인 PVP - ${roomCode}`}
        </h2>
        <div className="player-info-header">
          {roomCode !== "LOCAL" ? (
            <>
              <div className="player-badge">
                <span className={`color-indicator ${playerColor}`}></span>
                <span>{playerName}</span>
              </div>
              <span className="vs">VS</span>
              <div className="player-badge">
                <span className={`color-indicator ${playerColor === 'white' ? 'black' : 'white'}`}></span>
                <span>{opponentName || "상대"}</span>
              </div>
            </>
          ) : (
            <div className="player-indicator">
              로컬 대전 모드
            </div>
          )}
        </div>
      </div>

      <div className="pvp-game-content">
        <div className="pvp-board-section">
          <div className="turn-indicator">
            {game.turn() === 'w' ? '⚪ 백' : '⚫ 흑'}의 차례
            {roomCode !== "LOCAL" && (
              <span className={`turn-badge ${(game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black') ? 'your-turn' : 'opponent-turn'}`}>
                {(game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black') ? '당신 차례' : '상대 차례'}
              </span>
            )}
          </div>
          
          <Chessboard
            position={currentFen}
            onSquareClick={onSquareClick}
            boardWidth={600}
            customSquareStyles={highlightSquares}
            boardOrientation={roomCode === "LOCAL" ? "white" : playerColor}
          />

          <div className="move-counter">
            📊 총 수: {fenHistory.length - 1}
          </div>

          <div className="game-controls">
            <button onClick={requestResetGame} className="control-btn reset">
              🔄 새 게임
            </button>
            <button onClick={leaveRoom} className="control-btn leave">
              🚪 나가기
            </button>
            <button onClick={() => navigate("/")} className="control-btn home">
              🏠 메인으로
            </button>
          </div>
        </div>

        <div className="pvp-info-panel">
          <div className="captured-pieces-container">
            <h4>⚪ 백이 잡은 기물</h4>
            <div className="pieces">
              {(capturedPieces.white || []).map((piece, idx) => (
                <span key={idx} className="piece-symbol black">
                  {pieceSymbols[piece]}
                </span>
              ))}
              {(!capturedPieces.white || capturedPieces.white.length === 0) && (
                <span className="no-pieces">없음</span>
              )}
            </div>
          </div>

          <div className="captured-pieces-container">
            <h4>⚫ 흑이 잡은 기물</h4>
            <div className="pieces">
              {(capturedPieces.black || []).map((piece, idx) => (
                <span key={idx} className="piece-symbol white">
                  {pieceSymbols[piece]}
                </span>
              ))}
              {(!capturedPieces.black || capturedPieces.black.length === 0) && (
                <span className="no-pieces">없음</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {resetRequest && resetRequest.status === "pending" && (
        <div className="reset-request-modal">
          <div className="reset-request-content">
            <h3>🔄 새 게임 요청</h3>
            <p>{resetRequest.from}님이 새 게임을 시작하고 싶어합니다.</p>
            <div className="reset-request-buttons">
              <button onClick={acceptResetRequest} className="accept-btn">
                ✅ 수락
              </button>
              <button onClick={rejectResetRequest} className="reject-btn">
                ❌ 거절
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리플레이 저장 여부 모달 */}
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
                  toast.info("❌ 리플레이를 저장하지 않았습니다.");
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

      {/* 리플레이 제목 입력 모달 */}
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
                border: "1px solid #b58863",
                marginTop: "12px",
                width: "80%",
                fontSize: "1rem"
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
                  setReplayTitle("");
                  toast.info("❌ 리플레이를 저장하지 않았습니다.");
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

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
