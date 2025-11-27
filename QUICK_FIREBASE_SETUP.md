# 🚀 빠른 Firebase 설정 가이드

온라인 PVP 기능을 **5분 안에** 활성화하는 방법입니다.

## 1단계: Firebase 프로젝트 생성 (2분)

1. 🌐 [Firebase Console](https://console.firebase.google.com/) 접속
2. ➕ "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `my-chess-game`)
4. Google 애널리틱스 **건너뛰기** ⏭️
5. "프로젝트 만들기" 클릭

## 2단계: Realtime Database 활성화 (1분)

1. 왼쪽 메뉴에서 🔨 "빌드" → "Realtime Database" 클릭
2. "데이터베이스 만들기" 버튼 클릭
3. 위치 선택: **미국** (`us-central1`) 추천
4. 보안 규칙: **테스트 모드에서 시작** 선택 ✅
5. "사용 설정" 클릭

⚠️ **중요**: 테스트 모드는 30일 후 자동으로 차단됩니다. 나중에 보안 규칙을 업데이트하세요!

## 3단계: 웹 앱 등록 (1분)

1. 프로젝트 개요 페이지로 이동
2. `</>` (웹 아이콘) 클릭
3. 앱 닉네임 입력 (예: `Chess PVP Web`)
4. Firebase 호스팅 **체크 해제** ❌
5. "앱 등록" 클릭
6. SDK 설정 화면이 나오면 **코드 전체 복사** 📋

## 4단계: 설정값 붙여넣기 (1분)

1. 프로젝트에서 `src/utils/firebase.js` 파일 열기
2. 복사한 `firebaseConfig` 부분만 찾기
3. 아래 형태로 되어있는 부분을 **전체 교체**:

**변경 전** (기본값):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEMO_KEY_REPLACE_WITH_YOUR_ACTUAL_KEY",
  authDomain: "chess-demo.firebaseapp.com",
  databaseURL: "https://chess-demo-default-rtdb.firebaseio.com",
  projectId: "chess-demo",
  storageBucket: "chess-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**변경 후** (실제 값):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAaBbCc...", // 실제 API Key
  authDomain: "my-chess-game.firebaseapp.com",
  databaseURL: "https://my-chess-game-default-rtdb.firebaseio.com",
  projectId: "my-chess-game",
  storageBucket: "my-chess-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

4. 파일 **저장** 💾

## 5단계: 앱 재시작 (30초)

1. 터미널에서 `Ctrl + C`로 개발 서버 중지
2. `npm start` 명령어로 다시 시작
3. 브라우저에서 앱 새로고침

## ✅ 완료!

온라인 PVP 모드가 활성화되었습니다! 

메인 메뉴 → "🧑‍🤝‍🧑 PVP 대전"에서 이제 "➕ 방 만들기"와 "🔗 참가하기" 버튼이 활성화됩니다.

---

## 🔍 설정이 제대로 되었는지 확인하기

### 브라우저 콘솔 확인
1. `F12` 눌러서 개발자 도구 열기
2. "Console" 탭 선택
3. 다음 메시지가 보이면 성공:
   ```
   ✅ Firebase 연결 성공!
   ```

### 문제 발생 시
다음 메시지가 보이면 설정을 다시 확인하세요:
```
⚠️ Firebase 설정이 기본값입니다.
```

**해결 방법**:
1. `src/utils/firebase.js` 파일에서 설정값을 **정확히** 복사했는지 확인
2. 특히 `databaseURL`이 `https://your-project-name-default-rtdb.firebaseio.com` 형식인지 확인
3. 따옴표(`"`)를 빠뜨리지 않았는지 확인
4. 앱을 재시작했는지 확인

---

## 🎮 온라인 게임 테스트

**혼자 테스트하기** (2개의 브라우저 창 사용):

1. **창 1** (Chrome):
   - 방 만들기
   - 코드 복사 (예: ABC123)

2. **창 2** (시크릿 모드 또는 다른 브라우저):
   - 같은 주소 열기
   - 방 참가
   - 복사한 코드 입력

3. 두 창에서 번갈아가며 체스 플레이! ♟️

**친구와 테스트하기**:
1. 방 코드를 카카오톡/디스코드로 공유
2. 친구가 코드 입력하고 참가
3. 실시간 온라인 체스 대전 시작!

---

## 💡 추가 팁

### Firebase 사용량 확인
- Firebase Console → Realtime Database → 사용량 탭
- 무료 플랜: 동시 접속 100명, 1GB 저장공간
- 일반적인 체스 게임 **수천 게임** 가능

### 보안 규칙 업데이트 (선택사항)
테스트 모드는 30일 후 만료됩니다. 영구적으로 사용하려면:

1. Realtime Database → 규칙 탭
2. 다음 규칙 붙여넣기:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
3. "게시" 클릭

⚠️ 주의: 이 규칙은 누구나 읽고 쓸 수 있습니다. 프로덕션에서는 더 엄격한 규칙이 필요합니다.

---

## 🆘 문제 해결

### "Invalid token in path" 에러
→ `databaseURL`이 잘못되었습니다. Firebase Console에서 다시 확인하세요.

### 방이 생성되지 않음
→ Firebase Realtime Database가 활성화되었는지 확인하세요.

### 상대방이 입장해도 게임이 시작되지 않음
→ 브라우저 콘솔에서 에러 메시지를 확인하세요.

---

**더 자세한 설명이 필요하면 `FIREBASE_SETUP.md` 파일을 참고하세요!**
