import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "./components/MainMenu";
import Chessboard from "./components/Chessboard";
import ReplayViewer from "./components/ReplayViewer";
import ReplayList from "./components/ReplayList";
import PVPMode from "./components/PVPMode";


console.log("App loaded");

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/ai" element={<Chessboard />} />
        <Route path="/replay" element={<ReplayViewer />} />
        <Route path="/replay/:id" element={<ReplayViewer />} />
         <Route path="/replays" element={<ReplayList />} />
         <Route path="/pvp" element={<PVPMode />} />
      </Routes>
    </Router>
  );
}

export default App;

