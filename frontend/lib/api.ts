const RELEASE_API_URL = process.env.NEXT_PUBLIC_RELEASE_API_URL || "";
const DEV_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getApiUrl() {
  if (typeof window !== "undefined" && window.location.hostname.includes("release") && RELEASE_API_URL) {
    return RELEASE_API_URL;
  }
  return DEV_API_URL;
}

export async function fetchToken(userId: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("토큰 발급 실패");
  const data = await res.json();
  return data.access_token;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || `API 오류 (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// 인증
export const getToken = (userId: string) => fetchToken(userId);

// 홈
export const getBanner = () => apiFetch("/home/banner");
export const getSections = () => apiFetch("/home/sections");
export const getPersonalSections = (userId: string) => apiFetch(`/home/sections/${encodeURIComponent(userId)}`);

// 유저 (JWT 필수)
export const getProfile = () => apiFetch("/user/me/profile");
export const getWatching = () => apiFetch("/user/me/watching");
export const getHistory = () => apiFetch("/user/me/history");
export const getPurchases = () => apiFetch("/user/me/purchases");
export const getWishlist = () => apiFetch("/user/me/wishlist");
export const getPoints = () => apiFetch("/user/me/points");

// 추천
export const getRecommend = (userId: string) => apiFetch(`/recommend/${encodeURIComponent(userId)}`);
export const getSimilar = (assetId: string) => apiFetch(`/similar/${encodeURIComponent(assetId)}`);

// 시리즈
export const getSeriesDetail = (seriesNm: string) => apiFetch(`/series/${encodeURIComponent(seriesNm)}/detail`);
export const getEpisodes = (seriesNm: string) => apiFetch(`/series/${encodeURIComponent(seriesNm)}/episodes`);
export const getProgress = (seriesNm: string) => apiFetch(`/series/${encodeURIComponent(seriesNm)}/progress`);
export const getPurchaseCheck = (seriesNm: string) => apiFetch(`/series/${encodeURIComponent(seriesNm)}/purchase-check`);
export const getPurchaseOptions = (seriesNm: string) => apiFetch(`/series/${encodeURIComponent(seriesNm)}/purchase-options`);

// VOD 상세
export const getVODDetail = (assetId: string) => apiFetch(`/vod/${encodeURIComponent(assetId)}`);

// 에피소드 진행률 전송 (heartbeat / 즉시 반영)
export const postEpisodeProgress = (seriesNm: string, assetNm: string, completionRate: number, immediate = false) =>
  apiFetch(`/series/${encodeURIComponent(seriesNm)}/episodes/${encodeURIComponent(assetNm)}/progress`, {
    method: "POST",
    body: JSON.stringify({ completion_rate: completionRate, ...(immediate && { immediate: true }) }),
  });

// 검색
export const searchVOD = (query: string) => apiFetch(`/vod/search?q=${encodeURIComponent(query)}`);

// 구매/찜 (JWT 필수)
export const postPurchase = (seriesNm: string, optionType: string, pointsUsed: number) =>
  apiFetch("/purchases", {
    method: "POST",
    body: JSON.stringify({ series_nm: seriesNm, option_type: optionType, points_used: pointsUsed }),
  });

export const addWishlist = (seriesNm: string) =>
  apiFetch("/wishlist", {
    method: "POST",
    body: JSON.stringify({ series_nm: seriesNm }),
  });

export const removeWishlist = (seriesNm: string) =>
  apiFetch(`/wishlist/${encodeURIComponent(seriesNm)}`, { method: "DELETE" });

// 알림 (JWT 필수)
export const getNotifications = () => apiFetch("/user/me/notifications");
export const markNotificationRead = (id: number) =>
  apiFetch(`/user/me/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () =>
  apiFetch("/user/me/notifications/read-all", { method: "POST" });
export const deleteNotification = (id: number) =>
  apiFetch(`/user/me/notifications/${id}`, { method: "DELETE" });
