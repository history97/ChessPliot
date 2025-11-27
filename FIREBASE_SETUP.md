# Firebase 설정 가이드

온라인 PVP 기능을 사용하려면 Firebase 프로젝트를 생성하고 설정해야 합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: chess-pvp)
4. Google 애널리틱스는 선택사항 (건너뛰기 가능)
5. 프로젝트 생성 완료

## 2. 웹 앱 등록

1. Firebase 콘솔에서 프로젝트 선택
2. 프로젝트 설정 (⚙️) > 일반 탭
3. "앱 추가" > 웹 아이콘 (</>) 클릭
4. 앱 닉네임 입력 (예: Chess PVP Web)
5. Firebase 호스팅은 선택사항
6. "앱 등록" 클릭

## 3. Firebase Realtime Database 활성화

1. Firebase 콘솔 좌측 메뉴에서 "Realtime Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 위치 선택 (가까운 지역 선택, 예: asia-southeast1)
4. 보안 규칙 선택:
   - **테스트 모드**에서 시작 (개발용)
   - 또는 아래 규칙 직접 설정:

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

## 4. Firebase 설정값 복사

1. 프로젝트 설정에서 "SDK 설정 및 구성" 섹션 찾기
2. "구성" 라디오 버튼 선택
3. `firebaseConfig` 객체의 값들 복사

예시:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "chess-pvp-xxxxx.firebaseapp.com",
  databaseURL: "https://chess-pvp-xxxxx-default-rtdb.firebaseio.com",
  projectId: "chess-pvp-xxxxx",
  storageBucket: "chess-pvp-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

## 5. 설정값 적용

`src/utils/firebase.js` 파일을 열고 설정값을 붙여넣으세요:

```javascript
const firebaseConfig = {
  apiKey: "여기에_API_KEY",
  authDomain: "여기에_AUTH_DOMAIN",
  databaseURL: "여기에_DATABASE_URL",
  projectId: "여기에_PROJECT_ID",
  storageBucket: "여기에_STORAGE_BUCKET",
  messagingSenderId: "여기에_MESSAGING_SENDER_ID",
  appId: "여기에_APP_ID"
};
```

## 6. 패키지 설치

터미널에서 다음 명령어 실행:

```bash
npm install firebase
```

## 7. 앱 실행

```bash
npm start
```

## 보안 규칙 (프로덕션용)

개발이 완료되면 보다 안전한 보안 규칙으로 변경하세요:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "!data.exists() || data.child('status').val() == 'waiting'",
        ".validate": "newData.hasChildren(['code', 'host', 'hostColor', 'game', 'status'])",
        "moves": {
          ".write": "data.parent().child('status').val() == 'playing'"
        },
        "game": {
          ".write": "data.parent().child('status').val() == 'playing'"
        }
      }
    }
  }
}
```

## 문제 해결

### Firebase 연결 실패
- Firebase 설정값이 올바른지 확인
- Firebase 콘솔에서 Realtime Database가 활성화되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 방 생성/참가 실패
- 보안 규칙이 읽기/쓰기를 허용하는지 확인
- 네트워크 연결 상태 확인
- Firebase 콘솔의 Realtime Database 탭에서 데이터가 생성되는지 확인

### 실시간 동기화 안됨
- 인터넷 연결 확인
- Firebase Realtime Database 할당량 확인 (무료 플랜: 동시 연결 100개, 데이터 전송 10GB/월)
- 브라우저 콘솔에서 WebSocket 연결 에러 확인

## Firebase 무료 플랜 제한

- Realtime Database: 1GB 저장공간, 10GB 다운로드/월
- 동시 연결: 100개
- 충분한 체스 게임 수천 개를 호스팅 가능

## 다음 단계

1. 사용자 인증 추가 (Firebase Authentication)
2. 게임 히스토리 저장
3. 랭킹 시스템 구현
4. 채팅 기능 추가
5. 관전 모드 구현

## 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Realtime Database 가이드](https://firebase.google.com/docs/database)
- [보안 규칙 문서](https://firebase.google.com/docs/database/security)
