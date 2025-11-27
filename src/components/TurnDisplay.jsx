import React from "react";

export default function TurnDisplay({ turn, turnCount }) {
  return (
    <p className="turn-display">
      현재 턴: <strong>{turn === "w" ? "백" : "흑"}</strong> / 총 턴 수: <strong>{turnCount}</strong>
    </p>
  );
}
