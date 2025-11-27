import { saveReplay } from "./idb";

export function saveReplayToLocal(fenList) {
  console.log("✅ 저장 시도:", fenList);
  localStorage.setItem("lastReplay", JSON.stringify(fenList));
}

export function loadReplayFromLocal() {
  const raw = localStorage.getItem("lastReplay");
  console.log("📥 불러오기 시도:", raw);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("❌ JSON 파싱 실패:", err);
    return [];
  }
}


