# Shopping_Ad 팝업 프론트엔드 설계 문서

## 개요

VOD 재생 중 Shopping_Ad 파이프라인이 생성한 광고를 WebSocket으로 수신하여 팝업으로 표시한다.
광고 유형은 2가지: **지자체 축제 광고**(local_gov_popup / local_gov)와 **제철장터 광고**(seasonal_market).

---

## 아키텍처

```
┌──────────────────┐     WebSocket      ┌──────────────────┐
│   프론트엔드      │ ◄──────────────── │   API_Server      │
│                  │                    │                  │
│  series/[id]     │  playback_update   │  /ad/popup       │
│  page.tsx        │ ──────────────►   │  (WebSocket)     │
│                  │                    │                  │
│  useAdSocket     │  ad_action         │  serving.        │
│  ShoppingAdPopup │ ──────────────►   │  shopping_ad     │
└──────────────────┘                    └──────────────────┘
```

### 데이터 흐름

1. 사용자가 시리즈 상세 페이지 진입 → WebSocket 연결 (`user_id` 기반)
2. VOD 재생 시작 → 0.5초마다 `playback_update` 전송 (vod_id + time_sec)
3. 서버가 `serving.shopping_ad` 테이블에서 해당 vod_id + time_sec 구간 조회
4. 매칭되는 광고가 있으면 `ad_popup` 메시지 전송
5. 프론트엔드가 팝업 표시 → 사용자 인터랙션 → `ad_action` 전송

---

## 파일 구조

```
frontend/
├── lib/
│   └── useAdSocket.ts          ← WebSocket 연결 훅
├── components/
│   └── ShoppingAdPopup.tsx     ← 팝업 UI 컴포넌트
└── app/
    └── series/[series_id]/
        └── page.tsx            ← 통합 (훅 + 팝업 렌더링)
```

---

## 컴포넌트 명세

### useAdSocket(userId: string | null)

| 반환값 | 타입 | 설명 |
|--------|------|------|
| `ads` | `AdPopup[]` | 현재 수신된 광고 목록 |
| `lastResponse` | `AdResponse \| null` | 마지막 서버 응답 (시청예약 등) |
| `lastAlert` | `ReservationAlert \| null` | 마지막 시청예약 알림 |
| `sendPlaybackUpdate` | `(vodId, timeSec) => void` | 재생 위치 전송 |
| `sendAction` | `(action, vodId) => void` | 광고 액션 전송 |
| `removeAd` | `(vodId) => void` | 로컬 광고 목록에서 제거 |
| `setLastResponse` | setter | 응답 초기화 |
| `setLastAlert` | setter | 알림 초기화 |

### ShoppingAdPopup (Props)

| Prop | 타입 | 설명 |
|------|------|------|
| `ads` | `AdPopup[]` | 광고 목록 |
| `lastResponse` | `AdResponse \| null` | 서버 응답 |
| `lastAlert` | `ReservationAlert \| null` | 시청예약 알림 |
| `onAction` | `(action, vodId) => void` | 액션 콜백 |
| `onRemove` | `(vodId) => void` | 광고 제거 콜백 |
| `onClearResponse` | `() => void` | 응답 초기화 |
| `onClearAlert` | `() => void` | 알림 초기화 |

---

## 팝업 유형별 UI

### 지자체 축제 (local_gov_popup / local_gov)

```
┌─────────────────────────────┐
│  [축제 GIF 이미지]           │  520 x 300px
│  (GIF에 축제명+일정 포함)    │
│                             │
├─────────────────────────────┤
│                    [닫  기] │
└─────────────────────────────┘
    └→ 10초 후 자동 최소화 → 10초 후 자동 dismiss
```

- 버튼: [닫기] 1개
- `ad.data.ad_image_url`: GIF URL (OCI Object Storage, 520x300 가로형)
- `ad.data.product_name`: 축제명 (alt 텍스트용)
- 크기: 340x196 고정, 좁은 화면에서 `maxWidth: calc(100vw - 32px)` 반응형

### 제철장터 (seasonal_market) — 방송 중/예정 2종

**(1) 방송 중** (현재 시간이 start_time ~ end_time 사이)

```
┌─────────────────────────┐
│  [제철장터] CH 25 [LIVE] │
│                         │
│  지금 제철장터에서        │
│  {상품명} 판매 중입니다. │
│  시청 하시겠습니까?      │
│                         │
│  [시청 하기]  [닫  기]   │
└─────────────────────────┘
```

- [시청 하기] → 채널 25번(헬로비전 지역방송) 이동 + 팝업 닫기

**(2) 방송 예정** (아직 start_time 전)

```
┌─────────────────────────────┐
│  [제철장터] CH 25            │
│                             │
│  {날짜} 제철장터에서         │
│  {상품명} 판매 예정입니다.   │
│  ({start_time} ~ {end_time}) │
│  시청 예약 하시겠습니까?     │
│                             │
│  [시청 예약]  [닫  기]       │
└─────────────────────────────┘
```

- 날짜 포맷: `3월 25일(수)` 형태
- [시청 예약] → reserve_watch 액션 전송

**data 필드:**
- `ad.data.product_name`: 상품명
- `ad.data.channel`: "제철장터"
- `ad.data.start_time`: 방송 시작 시간 (HH:MM)
- `ad.data.end_time`: 방송 종료 시간 (HH:MM)
- `ad.data.broadcast_date`: 방송 날짜 (YYYY-MM-DD)

### 최소화 상태

```
  [🔵] [🔴]   ← 우측 하단 작은 원형 버튼
   ↑     ↑
  reopen dismiss
```

---

## 광고 타이밍 제어

### playback_update 전송 규칙
- 0.5초마다 `playback_update` 전송 (vod_id + time_sec)
- **에피소드 시작 시**: 5초 grace period (이어보기 시 광고 즉시 노출 방지)
- **seek 감지**: 이전 전송 시간과 30초 이상 차이 → 3초 grace period
- pause/buffer 후 resume 시 타이머 리셋 안 함 (grace 중복 방지)

### 에피소드 전환 시
- 기존 광고 전부 제거 (`ads` 배열 + `ShoppingAdPopup` 내부 `items` state 동기화)
- 자동 최소화/dismiss 타이머 전부 정리
- playback 타이머 정지 + 초기화
- **WebSocket 재연결** (백엔드 `_sent_ad_ids` 초기화)

### 전체화면
- YouTube 기본 전체화면 버튼 비활성화 (`fs: 0`)
- 커스텀 전체화면 버튼 (플레이어 우하단) → 컨테이너 전체화면 (팝업 오버레이 유지)

---

## 팝업 생명주기

```
서버에서 ad_popup 수신
  │
  ▼
[visible] ── 10초 경과 ──► [minimized]
  │                            │
  │ dismiss 클릭               │ reopen 클릭 → [visible]
  │                            │ dismiss 클릭 ↓
  ▼                            ▼
[dismissed] ◄─────────── [dismissed]
  │
  ▼
  로컬 목록에서 제거 + 서버에 dismiss 전송
```

### 제철장터 시청예약 흐름

```
[시청 예약] 클릭
  │
  ▼
reserve_watch 액션 전송
  │
  ▼
서버 응답 수신
  ├── message: "시청예약되었습니다" → 토스트 표시 → 2초 후 팝업 제거
  └── error: "시청예약에 실패했습니다" → 토스트 표시 (팝업 유지)
```

---

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | WebSocket 서버 주소 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | REST API 서버 주소 (기존) |

---

## 백엔드 의존성

### 백엔드 구현 상태

1. **`/ad/popup` WebSocket — playback_update 수신 처리** ✅ 구현됨 (PR #88)
   - 클라이언트가 `playback_update` 전송 시 `serving.shopping_ad` 조회
   - `ts_start <= time_sec <= ts_end` 조건으로 매칭
   - 매칭 광고를 `ad_popup` 메시지로 클라이언트에 전송
   - ⚠️ ts_start/ts_end 시간 필터링 이슈 확인 필요 (2026-03-27)

2. **시청예약 저장 및 알림** — 미확인
   - `reserve_watch` 액션 수신 시 예약 정보 DB 저장
   - 방송 시작 시 `reservation_alert` 메시지 push

### DB 테이블 참조

- `serving.shopping_ad` (gold layer)
  - 조회 인덱스: `idx_sa_vod_ts` (vod_id_fk, ts_start, ts_end)
  - 광고 유형 구분: `ad_action_type` (local_gov_popup / seasonal_market)
