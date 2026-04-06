// 컴포넌트 공용 타입 (API 응답을 매핑해서 사용)

export type VOD = {
  series_id: string
  asset_nm: string
  poster_url: string | null
  backdrop_url?: string | null
  genre?: string
  ct_cl?: string
  rating?: string
  release_year?: number
  disp_rtm?: number
  director?: string
  cast_lead?: string
  cast_guest?: string
  smry?: string
  score?: number
  source_title?: string | null
  is_free?: boolean
  youtube_url?: string | null
}

export type WatchingItem = {
  series_id: string
  asset_nm: string
  poster_url: string | null
  strt_dt?: string
  completion_rate: number
}

export type Episode = {
  episode_title: string
  category?: string | null
  poster_url: string | null
  is_free?: boolean
}

export type Pattern = {
  pattern_rank: number
  pattern_reason: string
  vod_list: VOD[]
}

// 포스터 URL 유틸
const FALLBACK_GRADIENTS = [
  'from-red-800 to-red-950',
  'from-blue-800 to-blue-950',
  'from-green-800 to-green-950',
  'from-purple-800 to-purple-950',
  'from-yellow-700 to-yellow-900',
  'from-pink-800 to-pink-950',
  'from-indigo-800 to-indigo-950',
  'from-teal-800 to-teal-950',
  'from-orange-800 to-orange-950',
  'from-cyan-800 to-cyan-950',
]

export function isImageUrl(url: string | null | undefined): boolean {
  return !!url && (url.startsWith('http') || url.startsWith('/'))
}

export function getFallbackGradient(name: string | undefined | null): string {
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length]
}
