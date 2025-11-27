# Chess Pliot♟️

체스 AI, 온라인/로컬 PVP, 리플레이 분석 기능을 포함한 종합 체스 웹 애플리케이션

> **학교 과제용 프로젝트**

## 👤 개발자 정보

- **이름**: 원재혁
- **학번**: 2021145046
- **제출일**: 2025년 11월 27일

## ✨ 주요 기능

### 1. AI 대국 🤖
- Stockfish 엔진 기반 체스 AI
- 난이도 조절 가능 (1-10 레벨)
- 체크메이트, 스테일메이트 자동 감지

### 2. PVP 모드 👥
- **온라인 PVP**: Firebase를 통한 실시간 대전
- **로컬 PVP**: 한 기기에서 번갈아가며 플레이
- 방 생성 및 코드 공유 시스템

### 3. 리플레이 시스템 📼
- 게임 자동 저장
- 한 수씩 복기 가능
- 제목 수정 및 즐겨찾기 기능
- 전체/즐겨찾기 탭 분리

### 4. 커스터마이징 🎨
- 다양한 체스판 테마
- 다크모드 지원
- 직관적인 UI/UX

## 🛠️ 기술 스택

- **Frontend**: React 18
- **라우팅**: React Router v6
- **체스 엔진**: Stockfish 17, Chess.js
- **데이터베이스**: Firebase Realtime Database, IndexedDB
- **UI 라이브러리**: React-Chessboard, React-Toastify
- **스타일링**: CSS3, Flexbox

## 📦 설치 및 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/chess-ai-app.git
cd chess-ai-app
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Firebase 설정

`src/utils/firebase.js` 파일에 본인의 Firebase 설정 추가:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. 개발 서버 실행

```bash
npm start
```

브라우저에서 자동으로 [http://localhost:3000](http://localhost:3000) 열림

### 5. 프로덕션 빌드 (선택)

```bash
npm run build
```

## 📂 프로젝트 구조

```
chess-ai-app/
├── public/
│   ├── pieces/              # 체스 기물 이미지
│   └── stockfish-17.1.js    # AI 엔진
├── src/
│   ├── components/
│   │   ├── Chessboard.jsx      # AI 대국
│   │   ├── PVPMode.jsx         # PVP 모드
│   │   ├── ReplayList.jsx      # 리플레이 관리
│   │   ├── ReplayViewer.jsx    # 리플레이 재생
│   │   └── MainMenu.jsx        # 메인 메뉴
│   ├── utils/
│   │   ├── idb.js             # IndexedDB
│   │   └── firebase.js        # Firebase
│   └── styles/                # CSS
└── README.md
```

## 🎮 사용 방법

### AI와 대국
1. 메인 메뉴에서 "AI와 대결하기" 선택
2. 난이도 슬라이더로 AI 레벨 조정
3. 원하는 체스판 테마 선택
4. 체스 게임 시작

### 온라인 PVP
1. "방 만들기" 클릭
2. 자동 생성된 6자리 코드 확인
3. 친구에게 코드 공유
4. 친구가 코드 입력하여 입장
5. 실시간 대전 시작

### 리플레이 관리
1. 게임 종료 시 저장 여부 선택
2. 제목 입력 (선택사항)
3. 리플레이 목록에서 관전
4. ⭐ 버튼으로 즐겨찾기 추가
5. 제목 수정 가능

## 💡 주요 구현 기능

### 1. 체스 로직
- Chess.js 라이브러리 활용
- FEN 표기법으로 상태 관리
- 합법적인 수만 이동 가능
- 캐슬링, 앙파상 지원

### 2. AI 알고리즘
- Stockfish 엔진 통합
- Web Worker로 비동기 처리
- 난이도별 탐색 깊이 조정

### 3. 실시간 동기화
- Firebase Realtime Database
- 양방향 실시간 업데이트
- 방 생성/입장 시스템

### 4. 데이터 저장
- IndexedDB로 로컬 저장
- 리플레이 CRUD 구현
- 즐겨찾기 필터링

## 📊 기능별 화면

### 메인 메뉴
- AI 대결, PVP, 리플레이 선택

### AI 대국
- 체스판, 잡은 기물, 턴 표시
- AI 난이도 조절, 테마 선택

### PVP 모드
- 로컬/온라인 선택
- 방 생성/입장 UI
- 실시간 게임 진행

### 리플레이
- 전체/즐겨찾기 탭
- 제목 수정, 삭제 기능
- 복기 컨트롤러

## 🔧 개발 환경

- **Node.js**: v16 이상
- **npm**: v8 이상
- **브라우저**: Chrome, Firefox, Safari (최신 버전)

## 📝 개발 과정

### 1단계: 기본 체스 게임 구현
- React 프로젝트 생성
- 체스판 UI 구성
- 기본 이동 로직

### 2단계: AI 통합
- Stockfish 엔진 추가
- Web Worker 설정
- 난이도 시스템

### 3단계: PVP 기능
- Firebase 설정
- 실시간 동기화
- 방 시스템

### 4단계: 리플레이 시스템
- IndexedDB 연동
- CRUD 구현
- 즐겨찾기 기능

### 5단계: UI/UX 개선
- 반응형 디자인
- 테마 시스템
- 사용자 피드백
