# Shopping_Ad 팝업 프론트엔드 설계 문서

## 개요

VOD 재생 중 Shopping_Ad 파이프라인이 생성한 광고를 WebSocket으로 수신하여 팝업으로 표시한다.
광고 유형은 2가지: **지자체 축제 광고**(local_gov)와 **제철장터 광고**(seasonal_market).

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

### 지자체 축제 (local_gov)

```
┌─────────────────────────┐
│  [축제 GIF/이미지]       │  h-40
│                         │
├─────────────────────────┤
│  축제명 (popup_title)    │
│  일정/설명 (popup_body)  │
└─────────────────────────┘
    └→ 10초 후 자동 최소화
```

- 버튼 없음
- `ad.data.image_url`: GIF 또는 이미지 URL
- `ad.data.popup_title`: 축제명
- `ad.data.popup_body`: 축제 일정/설명
- fallback: `ad.data.product_name`

### 제철장터 (seasonal_market)

```
┌─────────────────────────┐
│  [제철장터] CH 25번      │
│                         │
│  채널 25번 제철장터에서   │
│  {상품명} 판매 중입니다  │
│                         │
│  [시청 예약]  [닫  기]   │
└─────────────────────────┘
```

- `ad.data.popup_text_live`: 방송 중 팝업 텍스트
- `ad.data.popup_text_scheduled`: 방송 예정 팝업 텍스트
- `ad.data.product_name`: 상품명
- `ad.data.channel`: 채널 번호

### 최소화 상태

```
  [🔵] [🔴]   ← 우측 하단 작은 원형 버튼
   ↑     ↑
  reopen dismiss
```

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

### 필요한 백엔드 구현 (미완료)

1. **`/ad/popup` WebSocket — playback_update 수신 처리**
   - 클라이언트가 `playback_update` 전송 시 `serving.shopping_ad` 조회
   - `ts_start <= time_sec <= ts_end` 조건으로 매칭
   - 매칭 광고를 `ad_popup` 메시지로 클라이언트에 전송

2. **시청예약 저장 및 알림**
   - `reserve_watch` 액션 수신 시 예약 정보 DB 저장
   - 방송 시작 시 `reservation_alert` 메시지 push

### DB 테이블 참조

- `serving.shopping_ad` (gold layer)
  - 조회 인덱스: `idx_sa_vod_ts` (vod_id_fk, ts_start, ts_end)
  - 광고 유형 구분: `ad_action_type` (local_gov_popup / seasonal_market)
