import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAllReplays, 
  deleteReplay, 
  updateReplayTitle, 
  toggleFavorite,
  getFavoriteReplays 
} from "../utils/idb";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/MainMenu.css";

export default function ReplayList() {
  const [replays, setReplays] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadReplays();
  }, [currentTab]);

  async function loadReplays() {
    try {
      const list = currentTab === "all" 
        ? await getAllReplays() 
        : await getFavoriteReplays();
      
      const sorted = list.sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt)
      );
      setReplays(sorted);
      console.log("📚 IndexedDB 상태:", {
        총개수: list.length,
        데이터: sorted
      });
    } catch (error) {
      console.error("IndexedDB 에러:", error);
    }
  }

  function confirmDelete(replay) {
    setDeleteTarget(replay);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    
    try {
      console.log("🗑️ 삭제 시작:", deleteTarget.id);
      await deleteReplay(deleteTarget.id);
      const updated = replays.filter((r) => r.id !== deleteTarget.id);
      setReplays(updated);
      toast.success("✅ 리플레이가 삭제되었습니다.");
      console.log("✓ 삭제 완료. 남은 리플레이:", updated.length);
    } catch (error) {
      toast.error("❌ 삭제 중 오류가 발생했습니다.");
      console.error("삭제 에러:", error);
    }
    
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    toast.info("ℹ️ 삭제를 취소했습니다.");
  }

  function startEditing(replay) {
    setEditingId(replay.id);
    setEditTitle(replay.title);
  }

  async function saveEdit(replayId) {
    if (!editTitle.trim()) {
      toast.error("❌ 제목을 입력해주세요!");
      return;
    }

    try {
      await updateReplayTitle(replayId, editTitle.trim());
      setReplays(replays.map(r => 
        r.id === replayId ? { ...r, title: editTitle.trim() } : r
      ));
      toast.success("✅ 제목이 수정되었습니다.");
      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      toast.error("❌ 수정 중 오류가 발생했습니다.");
      console.error("제목 수정 에러:", error);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function handleToggleFavorite(replayId, event) {
    event.stopPropagation();
    
    try {
      const newFavoriteState = await toggleFavorite(replayId);
      setReplays(replays.map(r => 
        r.id === replayId ? { ...r, favorite: newFavoriteState } : r
      ));
      
      if (newFavoriteState) {
        toast.success("⭐ 즐겨찾기에 추가되었습니다.");
      } else {
        toast.info("🌟 즐겨찾기에서 제거되었습니다.");
      }

      if (currentTab === "favorites" && !newFavoriteState) {
        loadReplays();
      }
    } catch (error) {
      toast.error("❌ 즐겨찾기 처리 중 오류가 발생했습니다.");
      console.error("즐겨찾기 토글 에러:", error);
    }
  }

  return (
    <div className="main-menu">
      <h2 className="title">📚 저장된 리플레이 목록</h2>

      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "24px", 
        justifyContent: "center" 
      }}>
        <button
          onClick={() => setCurrentTab("all")}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            fontWeight: "600",
            borderRadius: "8px",
            border: "2px solid #b58863",
            background: currentTab === "all" ? "#b58863" : "#fff",
            color: currentTab === "all" ? "#fff" : "#2c3e50",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
        >
          📋 전체 리플레이
        </button>
        <button
          onClick={() => setCurrentTab("favorites")}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            fontWeight: "600",
            borderRadius: "8px",
            border: "2px solid #f1c40f",
            background: currentTab === "favorites" ? "#f1c40f" : "#fff",
            color: currentTab === "favorites" ? "#fff" : "#2c3e50",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
        >
          ⭐ 즐겨찾기
        </button>
      </div>

      {replays.length === 0 ? (
        <p style={{ fontSize: "1.1rem", color: "#555" }}>
          {currentTab === "all" 
            ? "저장된 리플레이가 없습니다. 게임을 플레이하고 리플레이를 저장해보세요!"
            : "즐겨찾기한 리플레이가 없습니다. 하트를 클릭하여 즐겨찾기를 추가해보세요!"}
        </p>
      ) : (
        <div className="menu-grid">
          {replays.map((replay) => (
            <div key={replay.id} style={{
              background: "linear-gradient(145deg, #fff, #f9f9f9)",
              padding: "20px",
              borderRadius: "12px",
              border: replay.favorite ? "2px solid #f1c40f" : "2px solid #b58863",
              marginBottom: "16px",
              boxShadow: replay.favorite 
                ? "0 4px 12px rgba(241, 196, 15, 0.3)" 
                : "0 4px 8px rgba(0,0,0,0.1)",
              position: "relative"
            }}>
              {/* 즐겨찾기 하트 버튼 - 작은 둥근 사각형 */}
              <button
                onClick={(e) => handleToggleFavorite(replay.id, e)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: replay.favorite ? "rgba(241, 196, 15, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  border: replay.favorite ? "1px solid #f1c40f" : "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  padding: "6px",
                  lineHeight: "1",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.1)";
                  e.target.style.background = replay.favorite ? "rgba(241, 196, 15, 0.2)" : "rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.background = replay.favorite ? "rgba(241, 196, 15, 0.1)" : "rgba(0, 0, 0, 0.05)";
                }}
                title={replay.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {replay.favorite ? "❤️" : "🤍"}
              </button>

              {/* 제목 편집 */}
              {editingId === replay.id ? (
                <div style={{ marginBottom: "12px", marginRight: "50px" }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "1rem",
                      border: "2px solid #3498db",
                      borderRadius: "6px",
                      marginBottom: "8px"
                    }}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveEdit(replay.id);
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => saveEdit(replay.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.9rem",
                        background: "#27ae60",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      ✅ 저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.9rem",
                        background: "#95a5a6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      ❌ 취소
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginRight: "50px" }}>
                  <p style={{ 
                    margin: "0 0 8px 0", 
                    fontSize: "1rem", 
                    fontWeight: "600", 
                    color: "#2c3e50"
                  }}>
                    📝 제목: {replay.title || "무제 리플레이"}
                  </p>
                </div>
              )}

              <p style={{ margin: "8px 0", fontSize: "0.95rem", color: "#555" }}>
                🕐 시작 시간: {new Date(replay.startedAt).toLocaleString()}
              </p>
              <p style={{ margin: "8px 0", fontSize: "0.95rem", color: "#555" }}>
                🎯 수의 개수: {replay.fenHistory.length}
              </p>
              
              {/* 버튼 구성: 관전하기, 수정, 삭제 */}
              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => navigate(`/replay/${replay.id}`)}
                  style={{
                    flex: "1",
                    padding: "10px",
                    fontSize: "0.95rem"
                  }}
                >
                  ▶️ 관전하기
                </button>
                <button
                  onClick={() => startEditing(replay)}
                  style={{
                    flex: "0.7",
                    padding: "10px",
                    fontSize: "0.95rem",
                    background: "#3498db",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={() => confirmDelete(replay)}
                  style={{ 
                    flex: "0.7",
                    padding: "10px",
                    fontSize: "0.95rem",
                    background: "#a71d2a" 
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))}

          <div className="panel-buttons">
            <button onClick={() => navigate("/")}>🏠 메인화면으로</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>"{deleteTarget?.title || "무제 리플레이"}"를 삭제하시겠습니까?</p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "12px",
                justifyContent: "center",
              }}
            >
              <button onClick={handleDelete} className="menu-button">
                예
              </button>
              <button
                onClick={cancelDelete}
                className="menu-button"
                style={{ background: "#a71d2a" }}
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
