import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

export default function ReplayAnalyzer({ fenHistory }) {
  const [scoreData, setScoreData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!fenHistory || fenHistory.length < 2) return;

    const stockfish = new Worker("/stockfish-17.1-8e4d048.js");
    let index = 0;
    const rawScores = [];

    stockfish.onmessage = (event) => {
      const line = event.data;

      if (line.includes("info depth") && line.includes("score cp")) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) {
          const cp = parseInt(match[1]);
          rawScores.push(cp);
        }
      }

      if (line.startsWith("bestmove")) {
        index++;
        if (index < fenHistory.length) {
          stockfish.postMessage(`position fen ${fenHistory[index]}`);
          stockfish.postMessage("go depth 12");
        } else {
          // 각 수마다 데이터 포인트 생성 (한 수 간격)
          const moves = [];
          
          // fenHistory 길이만큼만 처리 (실제 대국 수)
          const actualMoveCount = fenHistory.length;

          for (let i = 0; i < actualMoveCount && i < rawScores.length; i++) {
            const score = rawScores[i];
            
            // Blunder 판정: 급격한 점수 변화 감지
            let isBlunder = false;
            let blunderType = "";
            
            if (i > 0) {
              const prevScore = rawScores[i - 1];
              const scoreChange = score - prevScore;
              const absChange = Math.abs(scoreChange);
              
              // 1. 절대 변화량이 100cp 이상인 경우 (급격한 변화)
              if (absChange >= 100) {
                isBlunder = true;
                blunderType = "급격한 변화";
              }
              // 2. 우세가 전환되면서 50cp 이상 변화한 경우
              else if ((prevScore > 0 && score < 0) || (prevScore < 0 && score > 0)) {
                if (absChange >= 50) {
                  isBlunder = true;
                  blunderType = "우세 전환";
                }
              }
              // 3. 같은 방향이지만 점수가 70cp 이상 악화된 경우
              else if (absChange >= 70) {
                // 백의 차례 (짝수 인덱스): 점수가 증가하면 백에게 불리
                // 흑의 차례 (홀수 인덱스): 점수가 감소하면 흑에게 불리
                const isWhiteTurn = i % 2 === 0;
                if ((isWhiteTurn && scoreChange > 0) || (!isWhiteTurn && scoreChange < 0)) {
                  isBlunder = true;
                  blunderType = "큰 실수";
                }
              }
            }
            
            // 수 번호: 1, 2, 3, 4... (백1, 흑1, 백2, 흑2...)
            const moveNumber = i + 1;
            
            // 누구의 수인지 표시
            const player = i % 2 === 0 ? '백' : '흑';
            const turnNumber = Math.floor(i / 2) + 1;
            
            moves.push({ 
              move: moveNumber,
              score: score,
              isBlunder,
              blunderType,
              player,
              turn: turnNumber,
              label: `${turnNumber}턴 ${player}`
            });
          }

          console.log(`📊 그래프 데이터: ${moves.length}개 수 (fenHistory: ${fenHistory.length}, rawScores: ${rawScores.length})`);
          console.log(`⚠️ Blunder 감지: ${moves.filter(m => m.isBlunder).length}회`);
          setScoreData(moves);
          setLoading(false);
          stockfish.terminate();
          computeSummary(moves);
        }
      }
    };

    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`position fen ${fenHistory[0]}`);
    stockfish.postMessage("go depth 12");

    return () => stockfish.terminate();
  }, [fenHistory]);

  function computeSummary(data) {
    const values = data.map(d => d.score);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);
    let swings = 0;
    let blunders = 0;
    for (let i = 1; i < values.length; i++) {
      if ((values[i - 1] < 0 && values[i] > 0) || (values[i - 1] > 0 && values[i] < 0)) {
        swings++;
      }
    }
    for (const d of data) {
      if (d.isBlunder) blunders++;
    }
    setSummary({ avg, max, min, swings, blunders });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '2px solid #8b6f47',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#2c3e50' }}>{data.label}</p>
          <p style={{ margin: '4px 0 0 0', color: '#555' }}>평가값: <strong>{data.score} cp</strong></p>
          {data.isBlunder && (
            <>
              <p style={{ margin: '4px 0 0 0', color: 'red', fontWeight: 'bold' }}>⚠️ Blunder!</p>
              <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '0.9rem' }}>({data.blunderType})</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: "24px", width: "100%" }}>
      <h2 style={{ color: "#2c3e50", marginBottom: "24px" }}>📊 백 vs 흑 우세 그래프</h2>
      {loading ? (
        <p style={{ fontSize: "1.1rem", color: "#2c3e50", fontWeight: "600" }}>Stockfish가 각 턴을 분석 중입니다...</p>
      ) : (
        <>
          <div style={{
            width: "100%",
            height: "600px",
            minWidth: 0,
            boxSizing: "border-box",
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid stroke="#ddd" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="move" 
                  label={{ value: "수 (Move)", position: "insideBottom", offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
                  tick={{ fontSize: 12 }}
                  domain={[1, scoreData.length]}
                  type="number"
                />
                <YAxis 
                  label={{ value: "흑 우세 (+) / 백 우세 (-)", angle: -90, position: "insideLeft", style: { fontSize: 14, fontWeight: 'bold' } }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ff6600"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isBlunder) {
                      return <circle cx={cx} cy={cy} r={6} fill="red" stroke="darkred" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={3} fill="#ff6600" />;
                  }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {summary && (
            <div style={{ 
              marginTop: "32px", 
              fontSize: "17px", 
              lineHeight: "1.8",
              background: "linear-gradient(145deg, #ffffff, #f9f9f9)",
              padding: "24px",
              borderRadius: "12px",
              border: "2px solid #b58863",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ 
                color: "#2c3e50", 
                marginBottom: "20px", 
                borderBottom: "3px solid #b58863", 
                paddingBottom: "10px",
                fontSize: "1.5rem",
                fontWeight: "800"
              }}>📈 요약 통계</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                  📌 평균 우세 점수: <strong style={{ fontSize: "1.1em", color: "#2c3e50" }}>{summary.avg} cp</strong>
                </li>
                <li style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                  🔝 흑 최대 우세: <strong style={{ fontSize: "1.1em", color: "#4caf50" }}>{summary.max} cp</strong>
                </li>
                <li style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                  🔻 백 최대 우세: <strong style={{ fontSize: "1.1em", color: "#f44336" }}>{summary.min} cp</strong>
                </li>
                <li style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                  🔄 우세 전환 횟수: <strong style={{ fontSize: "1.1em", color: "#2c3e50" }}>{summary.swings}회</strong>
                </li>
                <li style={{ marginBottom: "12px", color: "#2c3e50", fontWeight: "600" }}>
                  ❗ Blunder 턴: <strong style={{ fontSize: "1.1em", color: "#ff9800" }}>{summary.blunders}회</strong>
                </li>
              </ul>
              <div style={{ 
                marginTop: "20px", 
                padding: "16px", 
                background: "rgba(255, 152, 0, 0.08)",
                borderLeft: "4px solid #ff9800",
                borderRadius: "6px",
                fontSize: "15px",
                color: "#2c3e50"
              }}>
                <strong style={{ fontSize: "16px", color: "#2c3e50" }}>📖 Blunder 판정 기준:</strong>
                <ul style={{ margin: "12px 0 0 0", paddingLeft: "24px", color: "#2c3e50" }}>
                  <li style={{ marginBottom: "6px" }}>절대 변화량 100cp 이상 (급격한 변화)</li>
                  <li style={{ marginBottom: "6px" }}>우세 전환 시 50cp 이상 변화</li>
                  <li>같은 방향으로 70cp 이상 악화</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
