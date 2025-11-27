import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase 설정
// 실제 Firebase Console에서 받은 설정값입니다.
const firebaseConfig = {
  apiKey: "AIzaSyDT4rGSHda7oTbdkyPa4AM-MtpNUbishNM",
  authDomain: "chess-pvp-5375f.firebaseapp.com",
  databaseURL: "https://chess-pvp-5375f-default-rtdb.firebaseio.com", // 추가!
  projectId: "chess-pvp-5375f",
  storageBucket: "chess-pvp-5375f.firebasestorage.app",
  messagingSenderId: "64445205566",
  appId: "1:64445205566:web:ddf764ca9c22b88076556f",
  measurementId: "G-7LWW95NT0N"
};

// Firebase 설정이 유효한지 확인
function isValidFirebaseConfig(config) {
  // 데모 기본값과 비교
  const isDemoConfig = 
    config.apiKey === "AIzaSyDEMO_KEY_REPLACE_WITH_YOUR_ACTUAL_KEY" ||
    config.projectId === "chess-demo" ||
    config.databaseURL === "https://chess-demo-default-rtdb.firebaseio.com";
  
  // 필수 필드가 모두 있는지 확인
  const hasRequiredFields = 
    config.apiKey && 
    config.projectId && 
    config.authDomain;
  
  return !isDemoConfig && hasRequiredFields;
}

let app = null;
let database = null;

try {
  if (isValidFirebaseConfig(firebaseConfig)) {
    // Firebase 초기화
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("✅ Firebase 연결 성공!");
    console.log("📡 Database URL:", firebaseConfig.databaseURL);
  } else {
    console.warn("⚠️ Firebase 설정이 기본값입니다. src/utils/firebase.js에서 실제 설정값으로 변경해주세요.");
    console.warn("Firebase 설정 가이드: FIREBASE_SETUP.md 참고");
  }
} catch (error) {
  console.error("❌ Firebase 초기화 실패:", error.message);
  console.error("설정값을 확인하세요:", firebaseConfig);
}

export { database, app, isValidFirebaseConfig };
export default app;
