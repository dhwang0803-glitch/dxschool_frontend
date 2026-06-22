# LG 헬로비전 — 멀티모달 VOD 추천·광고 시스템 (Frontend)

> 하이브리드 VOD 추천 + 영상 인식 맥락 광고를 제공하는 IPTV 시청자 인터페이스.

**5인 팀 (2026.02–04)**

담당: **조장(PM) · 기획 · 풀스택** — 프로젝트 기획·PM, 프론트엔드 UI/UX 설계, Figma MCP 연동 자연어 UI 디자인, Playwright E2E 테스트

[![Portfolio](https://img.shields.io/badge/Portfolio-dhwang0803--glitch.vercel.app-000000?style=flat-square&logo=vercel&logoColor=white)](https://dhwang0803-glitch.vercel.app/projects/lg-hellovision-vod)
[![Backend Repo](https://img.shields.io/badge/Backend_Repo-vod__recommend__system-181717?style=flat-square&logo=github)](https://github.com/dhwang0803-glitch/vod_recommend_system)

---

## Overview

LG 헬로비전 VOD 시청 데이터 약 400만 건을 기반으로 개인화 추천과 시청 맥락 기반 타겟팅 광고를 제공하는 프론트엔드 애플리케이션.

- **개인화 홈**: ALS + CLIP/SBERT 하이브리드 추천 VOD 배너·선반 UI
- **맥락 광고 팝업**: YOLO·CLIP·STT·OCR 4종 앙상블로 인식된 음식/관광지에 대한 시청 방해 없는 하단 팝업 광고 2종
- **LLM 추천 문구**: K-Means 5개 세그먼트별 페르소나 기반 감성 추천 문구 노출
- **콜드스타트 대응**: 신규 유저에게 인기 기반 → 연령대 보충 → 개인화 3단계 UI

---

## Key Results

| 지표 | 결과 |
|------|------|
| Genre Precision@10 | **91.2%** (+40%p) |
| 한식 인식 YOLO Precision | **98.2%** |
| 평균 유사도 점수 | **95.8%** |

---

## Tech Stack

| Category | Stack |
|----------|-------|
| **Framework** | Next.js · React |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **API** | REST · WebSocket (실시간 광고 트리거) |
| **Testing** | Playwright E2E |
| **AI Native** | Claude Code · Figma MCP 연동 자연어 UI 디자인 |

---

## Features

### 1. VOD 추천 UI
- TOP10 배너: 하이브리드 추천 상위 VOD + 추천 이유(태그 기반) 표시
- 태그 선반: 사용자 선호 태그별 미시청 VOD Top10 배열
- 콜드스타트: 시청 이력 없는 신규 유저에게 인기/연령대 기반 추천

### 2. 맥락 광고 팝업
- TV 시청 방해하지 않는 하단 팝업 UI 2종 출력
- 제철장터: 방송중/예정 실시간 판별 → 채널 이동 또는 시청예약
- 축제: GIF 기반 지역 관광 광고

### 3. 검색 · 상세
- VOD 검색 (벡터 유사도 기반)
- VOD 상세 페이지 (포스터 · 메타 · 유사 콘텐츠)

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Related

- [Backend Repository](https://github.com/dhwang0803-glitch/vod_recommend_system)
- [포트폴리오 상세](https://dhwang0803-glitch.vercel.app/projects/lg-hellovision-vod)

---

## Team

| 이름 | 역할 |
|------|------|
| 황대원 | **조장(PM) · 기획 · 풀스택** |
| 신정윤 | 백엔드 · 행렬분해 추천엔진 |
| 이가원 | 프론트·백엔드 · UI/UX 디자인 · 추천엔진 |
| 박아름 | 프론트·백엔드 · 맥락형 광고 시스템 |
| 최기문 | 백엔드 · 데이터 파이프라인 · 데이터 분석 |

**기간**: 2026.02 ~ 04 (5인)
