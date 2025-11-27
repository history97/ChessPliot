import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MainMenu.css";

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="main-menu">
      <div className="title-container">
        <h1 className="title">♟️ ChessPilot</h1>
        <p className="subtitle">AI와 함께하는 체스 학습 플랫폼</p>
      </div>
      
      <div className="menu-grid">
        <button onClick={() => navigate("/ai")}>
          🧠 AI와 트레이닝
        </button>
        <button onClick={() => navigate("/pvp")}>
          🧑‍🤝‍🧑 PVP 대전
        </button>
        <button onClick={() => navigate("/replay")}>
          🎥 리플레이 관전
        </button>
        <button onClick={() => navigate("/replays")}>
          📚 리플레이 목록
        </button>
      </div>
      
      <div className="footer-decoration">
        ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜
      </div>
    </div>
  );
}
