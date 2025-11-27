import React from "react";
import "../styles/Chessboard.css"; // 스타일 분리 권장

export default function CapturedPieces({ capturedWhite, capturedBlack }) {
  return (
    <div className="captured-panel">
      <h4>💀 잡힌 유닛</h4>

      <div className="captured-row">
        <strong>백 (내가 잃은 말)</strong>
        <div className="captured-pieces">
          {capturedWhite.map((piece, idx) => (
            <img
              key={idx}
              src={`/pieces/w${piece}.svg`}
              alt={piece}
              className="captured-piece"
            />
          ))}
        </div>
      </div>

      <div className="captured-row">
        <strong>흑 (상대가 잃은 말)</strong>
        <div className="captured-pieces">
          {capturedBlack.map((piece, idx) => (
            <img
              key={idx}
              src={`/pieces/b${piece}.svg`}
              alt={piece}
              className="captured-piece"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
