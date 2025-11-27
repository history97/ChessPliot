import React, { Component } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { saveReplayToLocal } from "../utils/replayStorage";

class AIChessGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      game: new Chess(),
      fenHistory: [],
      currentFen: "",
      isGameOver: false,
    };
  }

  componentDidMount() {
    const initialFen = this.state.game.fen();
    this.setState({ currentFen: initialFen, fenHistory: [initialFen] });
  }

  handleMove = (move) => {
    const { game, fenHistory } = this.state;
    const newGame = new Chess(game.fen());
    newGame.move(move);

    const newFen = newGame.fen();
    const updatedHistory = [...fenHistory, newFen];

    this.setState(
      {
        game: newGame,
        currentFen: newFen,
        fenHistory: updatedHistory,
      },
      () => {
        this.checkGameEnd();
        this.makeAIMove();
      }
    );
  };

  makeAIMove = () => {
    const { game } = this.state;
    if (game.game_over()) return;

    const moves = game.moves();
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);

    this.setState(
      (prev) => ({
        currentFen: game.fen(),
        fenHistory: [...prev.fenHistory, game.fen()],
      }),
      this.checkGameEnd
    );
  };

  checkGameEnd = () => {
    const { game, fenHistory } = this.state;
    console.log("✅ checkGameEnd() 호출됨");

    if (game.isGameOver()) {
      console.log("✅ 게임 종료 감지됨");
      this.setState({ isGameOver: true });
      saveReplayToLocal(fenHistory);
    }
  };

  onSquareClick = (source, target) => {
    const move = { from: source, to: target, promotion: "q" };
    if (this.state.game.move(move)) {
      this.handleMove(move);
    }
  };

  render() {
    const { currentFen, isGameOver } = this.state;

    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>🤖 AI와 대국 중</h2>
        <Chessboard position={currentFen} onSquareClick={this.onSquareClick} boardWidth={480} />
        {isGameOver && <p>✅ 대국 종료! 리플레이가 저장되었습니다.</p>}
      </div>
    );
  }
}

export default AIChessGame;


