import { openDB } from "idb";

// IndexedDB 초기화 - 버전 3으로 업그레이드
export const dbPromise = openDB("chess-replays", 3, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains("replays")) {
      db.createObjectStore("replays", { keyPath: "id" });
    }
    
    // 버전 3 업그레이드: 기존 데이터에 favorite 필드 추가
    if (oldVersion < 3) {
      console.log("IndexedDB를 버전 3으로 업그레이드했습니다");
    }
  },
});

// 리플레이 저장
export async function saveReplay(id, fenHistory, title = "무제 리플레이") {
  const db = await dbPromise;
  await db.put("replays", {
    id,
    title,
    startedAt: new Date().toISOString(),
    fenHistory,
    favorite: false,
  });
  console.log("💾 IndexedDB 저장 완료:", id);
}

// 리플레이 불러오기 (id로 조회)
export async function getReplay(id) {
  const db = await dbPromise;
  const result = await db.get("replays", id);
  console.log("📖 getReplay 결과:", result);
  return result;
}

// 전체 리플레이 목록 조회
export async function getAllReplays() {
  const db = await dbPromise;
  const all = await db.getAll("replays");
  console.log("📚 전체 리플레이 개수:", all.length);
  return all.map(replay => ({
    ...replay,
    favorite: replay.favorite ?? false
  }));
}

// 리플레이 삭제
export async function deleteReplay(id) {
  const db = await dbPromise;
  await db.delete("replays", id);
  console.log("🗑️ 삭제 완료:", id);
}

// 리플레이 제목 수정
export async function updateReplayTitle(id, newTitle) {
  const db = await dbPromise;
  const replay = await db.get("replays", id);
  if (replay) {
    replay.title = newTitle;
    await db.put("replays", replay);
    console.log("✏️ 제목 수정 완료:", id, "->", newTitle);
  }
}

// 즐겨찾기 토글
export async function toggleFavorite(id) {
  const db = await dbPromise;
  const replay = await db.get("replays", id);
  if (replay) {
    replay.favorite = !replay.favorite;
    await db.put("replays", replay);
    console.log("⭐ 즐겨찾기 토글:", id, "->", replay.favorite);
    return replay.favorite;
  }
  return false;
}

// 즐겨찾기 리플레이만 조회
export async function getFavoriteReplays() {
  const db = await dbPromise;
  const all = await db.getAll("replays");
  const favorites = all.filter(replay => replay.favorite === true);
  console.log("⭐ 즐겨찾기 리플레이 개수:", favorites.length);
  return favorites;
}
