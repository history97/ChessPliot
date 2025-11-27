import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { getAllReplays, getReplay } from "../utils/idb";
import "../styles/ReplayViewer.css";
import "react-toastify/dist/ReactToastify.css";
import ReplayAnalyzer from "./ReplayAnalyzer";

export default function ReplayViewer() {
  const [fenList, setFenList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFen, setCurrentFen] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [highlightSquares, setHighlightSquares] = useState({});
  const [replayMeta, setReplayMeta] = useState(null);
  const [activeTab, setActiveTab] = useState("board");
  
  // 시뮬레이션 관련 상태
  const [bestMove, setBestMove] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMoves, setSimulationMoves] = useState([]);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationFen, setSimulationFen] = useState("");
  const [simulationHighlights, setSimulationHighlights] = useState({});
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    async function loadReplay() {
      let replay = null;

      if (id) {
        replay = await getReplay(id);
        if (!replay) {
          toast.error("❌ 해당 리플레이를 찾을 수 없습니다.");
          return;
        }
      } else {
        const list = await getAllReplays();
        if (list.length > 0) {
          replay = list.sort((a, b) =>
            b.startedAt.localeCompare(a.startedAt)
          )[0];
        }
      }

      if (replay && replay.fenHistory?.length > 0) {
        setFenList(replay.fenHistory);
        setCurrentFen(replay.fenHistory[0]);
        setReplayMeta(replay);
        console.log("📥 리플레이 로드 완료:", replay.fenHistory.length, "수");
      } else {
        toast.warn("❌ 리플레이를 불러올 수 없습니다.");
      }
    }

    loadReplay();
  }, [id]);

  useEffect(() => {
    if (fenList.length > 0 && !isSimulating) {
      analyzeCurrentFen(currentFen);
    }
  }, [currentFen, fenList, isSimulating]);

  function goNext() {
    if (currentIndex < fenList.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentFen(fenList[nextIndex]);
      setIsSimulating(false);
    } else {
      toast.info("마지막 수까지 피드백 마쳤습니다.");
      setAnalysisText("마지막 수까지 피드백 마쳤습니다.");
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentFen(fenList[prevIndex]);
      setIsSimulating(false);
    }
  }

  function analyzeCurrentFen(fen) {
    const stockfish = new Worker("/stockfish-17.1-8e4d048.js");
    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage("go depth 15");

    stockfish.onmessage = (event) => {
      const line = event.data;
      if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        setBestMove(move);
        const explanation = explainMove(move, fen);
        setAnalysisText(explanation);

        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        
        const game = new Chess(fen);
        const piece = game.get(from);
        
        const pieceColors = {
          'p': 'rgba(255, 215, 0, 0.5)',
          'n': 'rgba(79, 195, 247, 0.5)',
          'b': 'rgba(156, 39, 176, 0.5)',
          'r': 'rgba(255, 107, 107, 0.5)',
          'q': 'rgba(255, 23, 68, 0.5)',
          'k': 'rgba(255, 235, 59, 0.5)'
        };
        
        const highlightColor = piece ? pieceColors[piece.type] : 'rgba(255, 165, 0, 0.5)';
        
        const squarePattern = /\b([a-h][1-8])\b/g;
        const mentionedSquares = explanation.match(squarePattern) || [];
        
        const highlights = {};
        
        highlights[from] = { 
          background: highlightColor.replace('0.5', '0.7'),
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
        };
        highlights[to] = { 
          background: highlightColor.replace('0.5', '0.7'),
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
        };
        
        const uniqueSquares = [...new Set(mentionedSquares)];
        uniqueSquares.forEach(square => {
          if (square !== from && square !== to) {
            const centerSquares = ['e4', 'e5', 'd4', 'd5'];
            if (centerSquares.includes(square)) {
              highlights[square] = {
                background: 'rgba(118, 255, 3, 0.4)',
                border: '2px solid rgba(118, 255, 3, 0.8)'
              };
            } else {
              highlights[square] = {
                background: 'rgba(33, 150, 243, 0.3)',
                border: '2px dashed rgba(33, 150, 243, 0.6)'
              };
            }
          }
        });
        
        setHighlightSquares(highlights);
        stockfish.terminate();
      }
    };
  }

  async function startSimulation() {
    if (!bestMove) {
      toast.error("❌ AI 추천 수가 없습니다.");
      return;
    }

    toast.info("🔮 AI 피드백을 반영한 시뮬레이션을 시작합니다...");
    
    const game = new Chess(currentFen);
    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);
    
    try {
      game.move({ from, to, promotion: 'q' });
    } catch (error) {
      toast.error("❌ AI 추천 수를 적용할 수 없습니다.");
      return;
    }

    const moves = [{ 
      fen: game.fen(), 
      move: bestMove,
      explanation: explainMove(bestMove, currentFen)
    }];

    const stockfish = new Worker("/stockfish-17.1-8e4d048.js");
    let moveCount = 0;
    const maxMoves = 3;

    stockfish.onmessage = (event) => {
      const line = event.data;
      
      if (line.startsWith("bestmove")) {
        const nextMove = line.split(" ")[1];
        
        if (nextMove && nextMove !== "(none)" && moveCount < maxMoves) {
          const from = nextMove.slice(0, 2);
          const to = nextMove.slice(2, 4);
          
          try {
            game.move({ from, to, promotion: 'q' });
            moves.push({
              fen: game.fen(),
              move: nextMove,
              explanation: explainMove(nextMove, game.fen())
            });
            moveCount++;

            if (moveCount < maxMoves && !game.isGameOver()) {
              stockfish.postMessage(`position fen ${game.fen()}`);
              stockfish.postMessage("go depth 12");
            } else {
              stockfish.terminate();
              setSimulationMoves(moves);
              setSimulationIndex(0);
              setSimulationFen(moves[0].fen);
              updateSimulationHighlights(moves[0].move, moves[0].fen);
              setIsSimulating(true);
              toast.success(`✅ ${moves.length}수 시뮬레이션 완료!`);
            }
          } catch (error) {
            stockfish.terminate();
            setSimulationMoves(moves);
            setSimulationIndex(0);
            setSimulationFen(moves[0].fen);
            updateSimulationHighlights(moves[0].move, moves[0].fen);
            setIsSimulating(true);
            toast.success(`✅ ${moves.length}수 시뮬레이션 완료!`);
          }
        } else {
          stockfish.terminate();
          setSimulationMoves(moves);
          setSimulationIndex(0);
          setSimulationFen(moves[0].fen);
          updateSimulationHighlights(moves[0].move, moves[0].fen);
          setIsSimulating(true);
          toast.success(`✅ ${moves.length}수 시뮬레이션 완료!`);
        }
      }
    };

    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage("go depth 12");
  }

  function updateSimulationHighlights(move, fen) {
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    
    const game = new Chess(fen);
    const piece = game.get(to);
    
    const pieceColors = {
      'p': 'rgba(255, 215, 0, 0.5)',
      'n': 'rgba(79, 195, 247, 0.5)',
      'b': 'rgba(156, 39, 176, 0.5)',
      'r': 'rgba(255, 107, 107, 0.5)',
      'q': 'rgba(255, 23, 68, 0.5)',
      'k': 'rgba(255, 235, 59, 0.5)'
    };
    
    const highlightColor = piece ? pieceColors[piece.type] : 'rgba(255, 165, 0, 0.5)';
    
    const highlights = {};
    highlights[from] = { 
      background: highlightColor.replace('0.5', '0.7'),
      boxShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
    };
    highlights[to] = { 
      background: highlightColor.replace('0.5', '0.7'),
      boxShadow: '0 0 15px rgba(255, 255, 255, 0.6)'
    };
    
    setSimulationHighlights(highlights);
  }

  function simPrev() {
    if (simulationIndex > 0) {
      const newIndex = simulationIndex - 1;
      setSimulationIndex(newIndex);
      setSimulationFen(simulationMoves[newIndex].fen);
      updateSimulationHighlights(simulationMoves[newIndex].move, simulationMoves[newIndex].fen);
    }
  }

  function simNext() {
    if (simulationIndex < simulationMoves.length - 1) {
      const newIndex = simulationIndex + 1;
      setSimulationIndex(newIndex);
      setSimulationFen(simulationMoves[newIndex].fen);
      updateSimulationHighlights(simulationMoves[newIndex].move, simulationMoves[newIndex].fen);
    }
  }

  function exitSimulation() {
    setIsSimulating(false);
    setSimulationMoves([]);
    setSimulationIndex(0);
    setSimulationFen("");
    setSimulationHighlights({});
    analyzeCurrentFen(currentFen);
    toast.info("📼 실제 리플레이로 돌아왔습니다.");
  }

  function explainMove(uciMove, fen) {
    if (!uciMove || uciMove === "(none)")
      return "<div class='section'>분석을 완료했습니다.</div>";

    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const game = new Chess(fen);
    let move;

    try {
      move = game.move({ from, to, promotion: "q" });
      if (!move) return "<div class='section'>분석을 완료했습니다.</div>";
    } catch {
      return "<div class='section'>분석을 완료했습니다.</div>";
    }

    const pieceNames = { p: "폰", n: "나이트", b: "비숍", r: "룩", q: "퀸", k: "킹" };
    const moveNumber = Math.floor(game.moveNumber());
    const isWhiteToMove = game.turn() === 'w';
    
    let explanation = `<div class="move-header">🎯 추천 수: <span class="piece-name piece-${move.piece}">${pieceNames[move.piece]}</span> <span class="square">${from}</span> → <span class="square">${to}</span></div>\n\n`;
    
    // 기본 수 정보
    explanation += `<div class="section"><div class="section-title">📚 수 ${moveNumber} - ${isWhiteToMove ? '백' : '흑'} 차례</div>`;
    explanation += `• ${pieceNames[move.piece]}을(를) ${from}에서 ${to}로 이동\n`;
    if (move.captured) {
      explanation += `• <span class="highlight-warning">${pieceNames[move.captured]} 포획!</span>\n`;
    }
    if (move.promotion) {
      explanation += `• <span class="highlight-good">프로모션: ${pieceNames[move.promotion]}</span>\n`;
    }
    explanation += `</div>\n`;
    
    // 전술적 분석
    explanation += `<div class="section"><div class="section-title">🎯 전술 피드백</div>`;
    
    // 체크 상태 확인
    if (game.inCheck()) {
      explanation += `• <span class="highlight-warning">⚠️ 체크!</span> 상대 킹이 위협받고 있습니다\n`;
    }
    
    // 체크메이트
    if (game.isCheckmate()) {
      explanation += `• <span class="highlight-good">🏆 체크메이트!</span> 게임 종료\n`;
    }
    
    // 스테일메이트
    if (game.isStalemate()) {
      explanation += `• <span class="highlight-neutral">🤝 스테일메이트</span> - 무승부\n`;
    }
    
    // 중앙 장악 분석
    const centerSquares = ['e4', 'e5', 'd4', 'd5'];
    if (centerSquares.includes(to)) {
      explanation += `• <span class="center-squares">중앙 장악</span> - ${to} 위치는 전략적으로 중요합니다\n`;
    }
    
    // 기물 전개
    if (move.piece === 'n' || move.piece === 'b') {
      const startRank = move.color === 'w' ? '1' : '8';
      if (from[1] === startRank) {
        explanation += `• <span class="highlight-good">기물 전개</span> - 오프닝 단계에서 좋은 움직임입니다\n`;
      }
    }
    
    // 캐슬링
    if (move.flags.includes('k') || move.flags.includes('q')) {
      const castleType = move.flags.includes('k') ? '킹사이드' : '퀸사이드';
      explanation += `• <span class="highlight-good">🏰 ${castleType} 캐슬링</span> - 킹의 안전을 확보했습니다\n`;
    }
    
    // 앙파상
    if (move.flags.includes('e')) {
      explanation += `• <span class="highlight-good">⚡ 앙파상</span> - 특수한 폰 포획입니다\n`;
    }
    
    explanation += `</div>\n`;
    
    // 포지션 평가
    explanation += `<div class="section"><div class="section-title">📊 포지션 평가</div>`;
    
    // 공격 가능한 상대 기물 체크
    const attacks = game.moves({ verbose: true }).filter(m => m.captured);
    if (attacks.length > 0) {
      explanation += `• <span class="highlight-warning">공격 기회 ${attacks.length}개</span> 발견\n`;
    }
    
    // 현재 가능한 수의 개수
    const possibleMoves = game.moves().length;
    if (possibleMoves > 0) {
      explanation += `• <span class="highlight-neutral">가능한 수: ${possibleMoves}개</span>\n`;
    }
    
    // 게임 상태 체크
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        explanation += `• <span class="highlight-good">🏆 체크메이트로 게임 종료</span>\n`;
      } else if (game.isStalemate()) {
        explanation += `• <span class="highlight-neutral">🤝 스테일메이트로 무승부</span>\n`;
      } else if (game.isDraw()) {
        explanation += `• <span class="highlight-neutral">무승부</span>\n`;
      }
    }
    
    explanation += `</div>\n`;
    
    // 전략적 조언
    explanation += `<div class="section"><div class="section-title">💡 전략 조언</div>`;
    
    if (moveNumber < 10) {
      explanation += `• <span class="opening-name">오프닝 단계</span> - 기물을 빠르게 전개하고 중앙을 장악하세요\n`;
    } else if (moveNumber < 30) {
      explanation += `• <span class="highlight-neutral">미들게임</span> - 전술적 기회를 찾고 포지션을 개선하세요\n`;
    } else {
      explanation += `• <span class="highlight-neutral">엔드게임</span> - 폰 구조와 킹의 활동성이 중요합니다\n`;
    }
    
    explanation += `</div>`;
    
    return explanation;
  }

  return (
    <div className="replay-container">
      <h2 className="replay-title">🎥 리플레이 관전</h2>
      {replayMeta && (
        <div className="replay-meta">
          <p>📛 리플레이 제목: {replayMeta.title || "무제 리플레이"}</p>
          <p>🕒 시작 시간: {new Date(replayMeta.startedAt).toLocaleString()}</p>
          <p>🔢 수의 개수: {replayMeta.fenHistory.length}</p>
        </div>
      )}
      
      {fenList.length > 0 ? (
        <>
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === "board" ? "active" : ""}`}
              onClick={() => setActiveTab("board")}
            >
              ♟️ 체스판 & 해설
            </button>
            <button 
              className={`tab-button ${activeTab === "graph" ? "active" : ""}`}
              onClick={() => setActiveTab("graph")}
            >
              📊 우세 그래프
            </button>
          </div>

          {activeTab === "board" && (
            <div className="replay-content-three-column">
              {/* 왼쪽: 기존 체스판 */}
              <div className="replay-board-section">
                <h4 className="board-title">📼 실제 리플레이</h4>
                <Chessboard
                  position={currentFen}
                  boardWidth={450}
                  arePiecesDraggable={false}
                  customSquareStyles={highlightSquares}
                />
                <div className="replay-controls">
                  <button onClick={goPrev} disabled={currentIndex === 0}>
                    ⬅️ 이전 수
                  </button>
                  <span>{currentIndex + 1} / {fenList.length}</span>
                  <button onClick={goNext} disabled={currentIndex === fenList.length - 1}>
                    다음 수 ➡️
                  </button>
                </div>
              </div>
              
              {/* 중앙: AI 추천 해설 패널 */}
              <div className="analysis-panel">
                <h3>💡 AI 추천 해설</h3>
                <div className="analysis-content" dangerouslySetInnerHTML={{ __html: analysisText }} />
                
                {/* AI 피드백 반영 섹션 */}
                {bestMove && (
                  <div className="simulation-controls">
                    <h4 style={{
                      color: '#fff',
                      fontSize: '1.1rem',
                      marginBottom: '12px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
                    }}>🔮 AI 피드백 시뮬레이션</h4>
                    {!isSimulating ? (
                      <>
                        <button onClick={startSimulation} className="simulation-btn">
                          🔮 AI 피드백 반영
                        </button>
                        <p className="simulation-hint">
                          AI 추천대로 두었을 때 향후 3수를 미리 확인할 수 있습니다
                        </p>
                      </>
                    ) : (
                      <>
                        <button onClick={exitSimulation} className="simulation-exit-btn">
                          ❌ 시뮬레이션 종료
                        </button>
                        <p className="simulation-hint">실제 리플레이로 돌아갑니다</p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="panel-buttons">
                  <button onClick={() => navigate("/")}>🏠 메인화면으로</button>
                  <button onClick={() => navigate("/ai")}>🤖 AI와 플레이하기</button>
                  <button onClick={() => navigate("/replays")}>📼 리플레이 목록</button>
                </div>
              </div>

              {/* 오른쪽: 시뮬레이션 체스판 */}
              {isSimulating && (
                <div className="replay-board-section simulation-board">
                  <div className="simulation-badge-board">
                    🔮 시뮬레이션 모드
                  </div>
                  <h4 className="board-title">🔮 AI 피드백 시뮬레이션</h4>
                  <Chessboard
                    position={simulationFen}
                    boardWidth={450}
                    arePiecesDraggable={false}
                    customSquareStyles={simulationHighlights}
                  />
                  <div className="replay-controls">
                    <button onClick={simPrev} disabled={simulationIndex === 0} className="sim-nav">
                      ⬅️ 이전 수
                    </button>
                    <span>시뮬 {simulationIndex + 1} / {simulationMoves.length}</span>
                    <button onClick={simNext} disabled={simulationIndex === simulationMoves.length - 1} className="sim-nav">
                      다음 수 ➡️
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "graph" && (
            <div className="graph-section">
              <ReplayAnalyzer fenHistory={fenList} />
              <div className="panel-buttons" style={{ marginTop: "24px", maxWidth: "800px" }}>
                <button onClick={() => navigate("/")}>🏠 메인화면으로</button>
                <button onClick={() => navigate("/ai")}>🤖 AI와 플레이하기</button>
                <button onClick={() => navigate("/replays")}>📼 리플레이 목록</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>저장된 리플레이가 없습니다.</p>
      )}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
