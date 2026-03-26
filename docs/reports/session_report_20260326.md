# feat/shopping-ad-popup 세션 리포트 (2026-03-26)

## 작업 내용

### Shopping_Ad 광고 팝업 프론트엔드 구현

`development` 브랜치에서 `feat/shopping-ad-popup` 브랜치를 생성하여 작업.

백엔드(`dxshcool` 레포) Shopping_Ad 파이프라인이 생성한 광고 데이터를
프론트엔드에서 WebSocket으로 수신하여 팝업으로 표시하는 기능 구현.

---

## 신규 파일

| 파일 | 역할 |
|------|------|
| `frontend/lib/useAdSocket.ts` | WebSocket 연결 훅 — 연결/재연결, 메시지 송수신 |
| `frontend/components/ShoppingAdPopup.tsx` | 광고 팝업 컴포넌트 — local_gov + seasonal_market 2종 |

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/app/series/[series_id]/page.tsx` | WebSocket 훅 연결, playback_update 전송, 팝업 렌더링 통합 |
| `frontend/app/globals.css` | `slideUp`, `fadeIn` 키프레임 애니메이션 추가 |

---

## 구현 상세

### 1. WebSocket 연결 (`useAdSocket.ts`)

- 엔드포인트: `ws://{host}/ad/popup?user_id={sha2_hash}`
- 환경변수: `NEXT_PUBLIC_WS_URL` (기본값 `ws://localhost:8000`)
- 재연결: 연결 끊김 시 3초 후 자동 재연결
- 수신 메시지 3종 처리:
  - `ad_popup` → 광고 팝업 표시
  - `ad_response` → 시청예약 성공/실패 응답
  - `reservation_alert` → 시청예약 알림 (방송 시작 시)

### 2. Playback Update 전송

- VOD 재생 중 **0.5초 간격**으로 서버에 현재 재생 위치 전송
- 메시지 형식: `{"type": "playback_update", "vod_id": "xxx", "time_sec": 120}`
- YouTube 플레이어 상태 연동: PLAYING 시 타이머 시작, PAUSED/ENDED 시 타이머 중지

### 3. 팝업 컴포넌트 (`ShoppingAdPopup.tsx`)

#### 지자체 축제 팝업 (local_gov)

- 축제 GIF/이미지 + 축제명 + 설명
- 버튼 없음 (정보 제공용)
- 10초 후 자동 최소화

#### 제철장터 팝업 (seasonal_market)

- 제철장터 라벨 + 채널 번호 + 상품 메시지
- [시청 예약] 버튼 → `reserve_watch` 액션 전송
- [닫기] 버튼 → `dismiss` 액션 전송
- 10초 미응답 → 자동 최소화

#### 최소화 상태

- 우측 하단에 파란색(다시 열기) + 빨간색(완전 제거) 작은 원형 버튼
- 파란색 클릭 → `reopen` 액션 전송
- 빨간색 클릭 → `dismiss` 액션 전송 + 팝업 완전 제거

#### 토스트 알림

- 시청예약 성공/실패 메시지, 시청예약 알림 수신 시 상단 중앙에 토스트 표시
- 3초 후 자동 제거

### 4. 시리즈 상세 페이지 통합

- `adUserId`: `useEffect`로 클라이언트에서만 `localStorage.getItem('user_id')` 읽기 (SSR hydration 불일치 방지)
- `currentAssetIdRef`: 에피소드 재생 시 `asset_id` 저장 → playback_update에 사용
- cleanup: 컴포넌트 언마운트 시 heartbeat + playbackTimer 모두 정리

---

## 서버 메시지 프로토콜

### Server → Client

```json
// 광고 팝업
{"type": "ad_popup", "ad_type": "local_gov|seasonal_market", "vod_id": "...", "time_sec": 120, "data": {...}}

// 액션 응답
{"type": "ad_response", "action": "reserve_watch", "vod_id": "...", "message": "시청예약되었습니다"}
{"type": "ad_response", "action": "reserve_watch", "vod_id": "...", "error": "시청예약에 실패했습니다"}

// 시청예약 알림
{"type": "reservation_alert", "channel": 25, "program_name": "...", "message": "..."}
```

### Client → Server

```json
// 재생 위치 업데이트 (0.5초 간격)
{"type": "playback_update", "vod_id": "...", "time_sec": 120}

// 광고 액션
{"type": "ad_action", "action": "reserve_watch|dismiss|minimize|reopen", "vod_id": "..."}
```

---

## 백엔드 연동 필요 사항

| 항목 | 상태 | 설명 |
|------|------|------|
| `serving.shopping_ad` 테이블 | 완료 | DDL 실행 + 10건 데이터 적재 완료 |
| `/ad/popup` WebSocket 스켈레톤 | 완료 | 연결/액션 처리 구현됨 |
| `playback_update` 수신 → DB 조회 → `ad_popup` 전송 | **미구현** | 백엔드에서 추가 구현 필요 |
| `reservation_checker` 알림 push | **미구현** | 방송 시작 시 예약 유저에게 알림 전송 |

---

## 빌드 확인

- `npm run build` 성공 (TypeScript 오류 없음)
- Next.js 16.2.0 (Turbopack)

## 점검 및 수정 사항

1. **`adUserId` SSR hydration 불일치** — 렌더링 중 `localStorage` 직접 접근 → `useState` + `useEffect`로 수정
2. **`initYouTubePlayer` 의존성 누락** — `startPlaybackTimer`, `stopPlaybackTimer`를 `useCallback` 의존성 배열에 추가
