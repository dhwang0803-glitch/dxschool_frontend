# 백엔드 추가 요청 사항

> 프론트엔드 연동을 위해 백엔드에 추가/수정 요청하는 항목 목록.
> 상세 협의 내용 → `docs/프론트엔드_요구사항(협의중).md`
> 작성일: 2026-03-21

---

## 1. 신규 엔드포인트 (17개)

### 인증
| 엔드포인트 | 설명 | 비고 |
|-----------|------|------|
| `POST /auth/token` | 셋톱박스 자동 로그인 (body: `user_id: sha2_hash`) | 만료 없음, 비로그인 시나리오 없음 |

### 홈 페이지
| 엔드포인트 | 설명 | 소스 테이블 |
|-----------|------|------------|
| `GET /home/banner` | 히어로 배너 top 5 (Hybrid score 내림차순) | `serving.hybrid_recommendation` |
| `GET /home/sections/{user_id}` | 사용자 장르별 시청 비중 기반 개인화 추천 섹션 + 미시청 장르 도전 섹션 | `watch_history`, `serving.popular_recommendation` |
| `GET /user/{user_id}/watching` | 이어보기 목록 (strt_dt 최신순 10개, completion_rate 포함) | `watch_history` |

**`GET /home/sections/{user_id}` 응답 스펙:**
```json
{
  "sections": [
    {
      "genre": "범죄/스릴러",
      "view_ratio": 38,
      "vod_list": [{ "series_id": "...", "asset_nm": "...", "poster_url": "..." }]
    },
    {
      "genre": "새로운 장르 도전",
      "view_ratio": 0,
      "vod_list": [...]
    }
  ]
}
```

### 시리즈 상세
| 엔드포인트 | 설명 | 소스 테이블 |
|-----------|------|------------|
| `GET /vod/{series_id}/episodes` | 에피소드 목록 (DISTINCT ON asset_nm 중복 제거, 페이지네이션 필수) | `public.vod` |
| `GET /user/{user_id}/series/{series_id}/progress` | 마지막 시청 에피소드 + completion_rate (이어보기 버튼 분기용) | `public.episode_progress` |
| `POST /user/{user_id}/episode/{episode_id}/progress` | 에피소드 시청 진행률 저장 (30초 heartbeat) | `public.episode_progress` |
| `GET /user/{user_id}/purchases/{series_id}` | 구매 여부 + 대여 만료 확인 | `public.purchase_history` |
| `POST /user/{user_id}/wishlist` | 찜 추가 (body: `series_id`) | `public.wishlist` |
| `DELETE /user/{user_id}/wishlist/{series_id}` | 찜 해제 | `public.wishlist` |

### 구매
| 엔드포인트 | 설명 | 비고 |
|-----------|------|------|
| `GET /vod/{series_id}/purchase-options` | 구매 옵션 (대여 490P / 영구 1490P) | - |
| `POST /purchases` | 포인트 차감 + 구매 기록 트랜잭션 | 포인트 부족 시 `402 INSUFFICIENT_POINTS` |

**`POST /purchases` 요청/응답:**
```json
// 요청
{ "user_id": "...", "series_id": "...", "option_type": "rental | permanent", "points_used": 490 }
// 응답
{ "purchase_id": 123, "remaining_points": 99510, "expires_at": "2026-03-21T15:30:00Z" }
```

### 마이페이지
| 엔드포인트 | 설명 | 비고 |
|-----------|------|------|
| `GET /user/{user_id}/profile` | 사용자 표시명(sha2_hash 앞 5자), 포인트 잔액 | 쿠폰 제외 |
| `GET /user/{user_id}/points` | 포인트 잔액 + point_history 내역 | point_history 실시간 집계 |
| `GET /user/{user_id}/history` | 시청 내역 (최근 3개월) | `watch_history` |
| `GET /user/{user_id}/purchases` | 구매 내역 | `public.purchase_history` |
| `GET /user/{user_id}/wishlist` | 찜 목록 (`created_at DESC` 최신순 고정) | `public.wishlist` |

### GNB 검색
| 엔드포인트 | 설명 | 비고 |
|-----------|------|------|
| `GET /vod/search?q={query}` | 제목·출연진·감독·장르 통합 검색 (최대 8건) | 응답: series_id, asset_nm, genre, ct_cl, poster_url |

### 알림 / 시청 예약
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /user/{user_id}/notifications` | 알림 목록 (응답: id, type, title, message, image_url, read) |
| `PATCH /user/{user_id}/notifications/{id}/read` | 알림 읽음 처리 |
| `DELETE /user/{user_id}/notifications/{id}` | 알림 삭제 |
| `POST /user/{user_id}/reservations` | 시청 예약 등록 (body: `series_id`, `scheduled_at`) |
| `DELETE /user/{user_id}/reservations/{id}` | 시청 예약 취소 |

> 알림 뱃지 카운트는 `read=false` 개수로 프론트에서 계산 예정.
> 알림 이미지는 `image_url` 필드로 제공 필요 (현재 이미지 자리만 있음).

---

## 2. 기존 엔드포인트 수정

### `GET /recommend/{user_id}` — 응답 구조 확장
현재 CF_Engine 결과만 반환 → `explanation_tags` + 패턴별 그룹핑 포함 필요.

```json
{
  "user_id": "string",
  "top_vod": { "series_id": "...", "asset_nm": "...", "poster_url": "..." },
  "patterns": [
    {
      "pattern_rank": 1,
      "pattern_reason": "봉준호 감독 작품을 즐겨 보셨어요",
      "vod_list": [{ "series_id": "...", "asset_nm": "...", "poster_url": "...", "score": 0.92 }]
    }
  ]
}
```

---

## 3. WebSocket — 광고 팝업 (`WS /ad/popup`)

| 타입 | 동작 |
|------|------|
| `local_gov` (지역광고) | 지역 사진 + 축제명 + 일정 팝업. 유저 버튼 없음. 10초 후 자동 최소화 |
| `seasonal_market` (제철장터) | "{상품명} 판매중" 메시지 + 시청예약/종료 버튼. 10초 후 자동 최소화 |

**Server → Client:**
```json
{ "type": "ad_popup", "ad_type": "local_gov | seasonal_market", "vod_id": "string", "time_sec": 120, "data": { ... } }
```

**Client → Server:**
```json
{ "type": "ad_action", "action": "reserve_watch | dismiss | minimize | reopen", "vod_id": "string" }
```

---

## 4. 신규 DB 테이블 (4개)

| 테이블 | 의존 엔드포인트 |
|--------|---------------|
| `public.wishlist` | GET/POST/DELETE `/user/{user_id}/wishlist` |
| `public.episode_progress` | GET/POST `/user/{user_id}/.../progress` |
| `public.purchase_history` | GET/POST `/purchases`, `/purchases/{series_id}` |
| `public.point_history` | GET `/user/{user_id}/points`, POST `/purchases` 트랜잭션 |

> DDL 상세 → `docs/프론트엔드_요구사항(협의중).md` 섹션 5 참조.

---

## 5. 공통 사항

| 항목 | 내용 |
|------|------|
| 에러 응답 형식 | `{"error": {"code": "ERROR_CODE", "message": "한글 메시지"}}` |
| 페이지네이션 | 25건/페이지, 스크롤 최하단 페이지 번호 버튼 (1~5) |
| 에피소드 검색 | asset_nm 기준, 출연진 초성검색, 회차 숫자 검색 지원 |
| series_id 식별자 | `vod` 테이블의 `series_nm` 컬럼으로 대체 확정 |
| CORS | 현행 `localhost:3000` 유지, 배포 시 조정 |
