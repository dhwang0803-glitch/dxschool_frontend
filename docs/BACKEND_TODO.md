# 프론트엔드 완료 후 백엔드 연동 필요 항목

> 현재 프론트엔드는 `mockData.ts` 기반으로 동작 중.
> 아래 항목들은 백엔드 API가 준비되면 순차적으로 교체 예정.
> 완료된 항목은 `[x]`로 표시 요청.

---

## 1. 인증 / 사용자

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 로그인 / 로그아웃 | 없음 (하드코딩 유저) | `POST /auth/login`, `POST /auth/logout` |
| 회원가입 | 없음 | `POST /auth/register` |
| 사용자 정보 조회 | `userAccount` mockData | `GET /users/me` |
| 다중 프로필 (가족) | UI만 있음 (전환 버튼) | `GET /users/me/profiles`, `POST /users/me/profiles` |

---

## 2. VOD 콘텐츠

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 홈 화면 섹션 데이터 | mockData 배열 | `GET /vod/home` (히어로배너, 장르별 목록) |
| 시리즈 상세 조회 | `getVODById()` mockData | `GET /vod/series/{series_id}` |
| 에피소드 목록 | `getEpisodes()` mockData | `GET /vod/series/{series_id}/episodes` |
| 유사 콘텐츠 | `getSimilarVODs()` mockData | `GET /vod/series/{series_id}/similar` |
| 검색 | 프론트 로컬 필터링 | `GET /vod/search?q={query}&type={title\|person\|genre}` |

---

## 3. 추천 시스템

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 스마트 추천 패턴 | `smartRecommendPatterns` mockData | `GET /recommend/patterns?user_id={id}` |
| 개인화 추천 | `personalizedVODs` mockData | `GET /recommend/personalized?user_id={id}` |
| 장르별 시청 비중 | 미구현 | `GET /users/me/genre-stats` |

---

## 4. 시청 기록 / 이어보기

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 이어보기 목록 | `watchingItems` mockData | `GET /users/me/watching` |
| 에피소드 진행률 | `episodeProgress` Map (휘발성) | `PUT /vod/episodes/{episode_id}/progress` (body: `completion_rate`) |
| 마지막 시청 에피소드 | `getLastWatchedEpisode()` mockData | `GET /vod/series/{series_id}/last-watched` |
| 시청 내역 (마이페이지) | mockData 정적 리스트 | `GET /users/me/history` |

---

## 5. 찜 기능

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 찜 목록 조회 | `wishlistIds` Map (휘발성) | `GET /users/me/wishlist` |
| 찜 추가 | 로컬 Map 조작 | `POST /users/me/wishlist/{series_id}` |
| 찜 삭제 | 로컬 Map 조작 | `DELETE /users/me/wishlist/{series_id}` |

---

## 6. 구매 / 결제

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 구매 여부 확인 | `purchasedIds` Set (휘발성) | `GET /users/me/purchases/{series_id}` |
| 구매 (대여/소장) | 로컬 포인트 차감 | `POST /purchases` (body: `series_id`, `option_type`) |
| 구매 내역 조회 | mockData 정적 리스트 | `GET /users/me/purchases` |

---

## 7. 포인트

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 보유 포인트 조회 | `userAccount.points` mockData | `GET /users/me/points` |
| 포인트 사용 내역 | `pointHistory` 배열 (휘발성) | `GET /users/me/points/history` |
| 포인트 충전 | 미구현 | `POST /users/me/points/charge` |

---

## 8. 알림 / 시청 예약

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 알림 목록 조회 | `reservations` 하드코딩 | `GET /users/me/notifications` |
| 알림 읽음 처리 | 미구현 | `PATCH /users/me/notifications/{id}/read` |
| 알림 삭제 | UI만 있음 (X버튼) | `DELETE /users/me/notifications/{id}` |
| 시청 예약 등록 | 미구현 | `POST /users/me/reservations` (body: `broadcast_id`) |
| 시청 예약 취소 | 미구현 | `DELETE /users/me/reservations/{id}` |

---

## 9. EPG (실시간 방송 편성표)

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 방송 편성표 조회 | 미구현 | `GET /epg?date={date}&channel={ch}` |
| 현재 방영 중 콘텐츠 | 미구현 | `GET /epg/now` |
| 방송 예정 시간 계산 | 하드코딩 ("2시간 후") | 위 EPG API 응답에서 계산 |

---

## 10. 영상 플레이어

| 항목 | 현재 상태 | 필요한 API |
|------|----------|-----------|
| 재생 URL 발급 | YouTube ID 하드코딩 | `GET /vod/episodes/{episode_id}/stream-url` |
| 자막 | 미구현 | `GET /vod/episodes/{episode_id}/subtitles` |

---

## 우선순위 제안

| 순위 | 항목 | 이유 |
|------|------|------|
| 1 | 인증 (로그인) | 모든 개인화 기능의 전제 조건 |
| 2 | VOD 콘텐츠 API | 실제 데이터로 교체 필수 |
| 3 | 시청 기록 / 이어보기 | 핵심 UX |
| 4 | 추천 시스템 | 차별화 핵심 기능 |
| 5 | 찜 / 구매 / 포인트 | 수익 모델 |
| 6 | 알림 / EPG | 차별화 기능 |
| 7 | 영상 플레이어 | 실제 스트리밍 연동 |
