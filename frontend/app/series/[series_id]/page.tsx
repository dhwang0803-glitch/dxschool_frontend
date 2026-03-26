'use client'
import { useState, use, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PosterCard from '@/components/PosterCard'
import ShoppingAdPopup from '@/components/ShoppingAdPopup'
import { VOD, isImageUrl, getFallbackGradient } from '@/lib/types'
import { useAdSocket } from '@/lib/useAdSocket'
import { getEpisodes, getProgress, getPurchaseCheck, getSimilar, addWishlist, removeWishlist, getVODDetail, postEpisodeProgress } from '@/lib/api'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export default function SeriesPage({ params }: { params: Promise<{ series_id: string }> }) {
  const { series_id } = use(params)
  const seriesNm = decodeURIComponent(series_id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const episodeFromQuery = searchParams.get('episode')

  const [loading, setLoading] = useState(true)
  const [episodes, setEpisodes] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [purchased, setPurchased] = useState(false)
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null)
  const [similar, setSimilar] = useState<VOD[]>([])
  const [wishlisted, setWishlisted] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  // YouTube 플레이어 상태
  const [playing, setPlaying] = useState(false)
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState(false)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null)

  const playerRef = useRef<any>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const episodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playingEpisodeRef = useRef<string | null>(null)
  const autoplayRef = useRef(false)

  // 광고 팝업 WebSocket
  const [adUserId, setAdUserId] = useState<string | null>(null)
  useEffect(() => {
    setAdUserId(localStorage.getItem('user_id'))
  }, [])
  const { ads, lastResponse, lastAlert, sendPlaybackUpdate, sendAction, removeAd, setLastResponse, setLastAlert } = useAdSocket(adUserId)
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentAssetIdRef = useRef<string | null>(null)

  // 로컬 진행률 업데이트 (API 재조회 없이 즉시 반영)
  const updateLocalProgress = useCallback((episodeTitle: string, rate: number) => {
    setProgress((prev: any) => {
      if (!prev) return { last_episode: episodeTitle, last_completion_rate: rate, episodes: [{ episode_title: episodeTitle, completion_rate: rate }] }
      const existingEps = prev.episodes || []
      const found = existingEps.some((e: any) => e.episode_title === episodeTitle)
      const eps = found
        ? existingEps.map((e: any) => e.episode_title === episodeTitle ? { ...e, completion_rate: rate } : e)
        : [...existingEps, { episode_title: episodeTitle, completion_rate: rate }]
      return { ...prev, last_episode: episodeTitle, last_completion_rate: rate, episodes: eps }
    })
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const stopPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
  }, [])

  const startPlaybackTimer = useCallback(() => {
    stopPlaybackTimer()
    playbackTimerRef.current = setInterval(() => {
      const player = playerRef.current
      const assetId = currentAssetIdRef.current
      if (!player || !assetId) return
      try {
        const current = player.getCurrentTime()
        if (current) sendPlaybackUpdate(assetId, Math.round(current))
      } catch { /* ignore */ }
    }, 500)
  }, [stopPlaybackTimer, sendPlaybackUpdate])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) return

    heartbeatRef.current = setInterval(() => {
      const player = playerRef.current
      const epTitle = playingEpisodeRef.current
      if (!player || !epTitle) return

      try {
        const current = player.getCurrentTime()
        const duration = player.getDuration()
        if (!duration) return

        const rate = Math.min(100, Math.round((current / duration) * 100))
        postEpisodeProgress(seriesNm, epTitle, rate).catch(() => {})
        updateLocalProgress(epTitle, rate)
      } catch {
        // player가 아직 준비되지 않은 경우 무시
      }
    }, 30000)
  }, [seriesNm, stopHeartbeat, updateLocalProgress])

  // YouTube 플레이어 초기화 (videoId로 히어로 영역에 재생)
  const initYouTubePlayer = useCallback((videoId: string) => {
    stopHeartbeat()
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
    setPlaying(true)
    setPlayerLoading(true)

    setTimeout(() => {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('yt-hero-player', {
        videoId,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onReady: () => setPlayerLoading(false),
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              startHeartbeat()
              startPlaybackTimer()
            } else {
              stopHeartbeat()
              stopPlaybackTimer()
              if (e.data === window.YT.PlayerState.ENDED && playingEpisodeRef.current) {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
                if (token) {
                  postEpisodeProgress(seriesNm, playingEpisodeRef.current, 100).catch(() => {})
                  updateLocalProgress(playingEpisodeRef.current, 100)
                }
              }
            }
          },
          onError: () => {
            setPlayerError(true)
            setPlaying(false)
            setPlayerLoading(false)
            stopHeartbeat()
          },
        },
      })
    }

    setTimeout(() => {
      if (window.YT?.Player) {
        initPlayer()
      } else {
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          document.head.appendChild(tag)
        }
        window.onYouTubeIframeAPIReady = initPlayer
      }
    }, 200)
  }, [seriesNm, startHeartbeat, stopHeartbeat, startPlaybackTimer, stopPlaybackTimer, updateLocalProgress])

  // 에피소드 재생 시작
  const playEpisode = useCallback(async (episodeTitle: string) => {
    setPlayerError(false)
    setActiveEpisode(episodeTitle)
    setPlayingEpisode(episodeTitle)
    playingEpisodeRef.current = episodeTitle

    // 에피소드의 asset_id로 VOD 상세 조회
    const ep = episodes.find((e: any) => e.episode_title === episodeTitle)
    const assetId = ep?.asset_id

    currentAssetIdRef.current = assetId || null

    if (assetId) {
      try {
        const vodDetail = await getVODDetail(assetId)
        if (vodDetail?.youtube_url) {
          const videoId = vodDetail.youtube_url.split('/embed/')[1]
          if (videoId) {
            initYouTubePlayer(videoId)
            return
          }
        }
      } catch {
        // VOD 상세 조회 실패
      }
    }

    // youtube_url을 못 가져온 경우: 히어로에 에피소드 포스터 표시
    if (ep?.poster_url) setPosterUrl(ep.poster_url)
    setPlaying(false)
    setPlayerLoading(false)
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [episodes, initYouTubePlayer])

  // 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const [episodesRes, progressRes, purchaseRes] = await Promise.allSettled([
          getEpisodes(seriesNm),
          getProgress(seriesNm),
          getPurchaseCheck(seriesNm),
        ])

        let loadedEpisodes: any[] = []

        if (episodesRes.status === 'fulfilled' && episodesRes.value) {
          loadedEpisodes = episodesRes.value.episodes || []
          setEpisodes(loadedEpisodes)
          const firstEp = loadedEpisodes[0]
          if (firstEp?.poster_url) setPosterUrl(firstEp.poster_url)
        }

        let hasProgress = false
        if (progressRes.status === 'fulfilled' && progressRes.value) {
          setProgress(progressRes.value)
          hasProgress = !!progressRes.value.last_episode
        }

        const fromWatching = !!episodeFromQuery
        const purchaseCheckOk = purchaseRes.status === 'fulfilled' && purchaseRes.value?.purchased === true
        setPurchased(purchaseCheckOk || hasProgress || fromWatching)
        if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
          setPurchaseInfo(purchaseRes.value)
        }
      } catch (e) {
        console.error('시리즈 데이터 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seriesNm, episodeFromQuery])

  // 이어보기 회차 하이라이트 (스크롤 없이 하이라이트만)
  useEffect(() => {
    if (loading) return
    const targetEpisode = episodeFromQuery || progress?.last_episode
    if (targetEpisode) {
      setActiveEpisode(targetEpisode)
    }
  }, [loading, episodeFromQuery, progress])

  // cleanup
  useEffect(() => {
    return () => {
      stopHeartbeat()
      stopPlaybackTimer()
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [stopHeartbeat, stopPlaybackTimer])

  const toggleWishlist = async () => {
    try {
      if (wishlisted) {
        await removeWishlist(seriesNm)
      } else {
        await addWishlist(seriesNm)
      }
      setWishlisted(!wishlisted)
    } catch (e) {
      console.error('찜 토글 실패:', e)
    }
  }

  if (loading) {
    return (
      <main className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white/50">로딩 중...</div>
      </main>
    )
  }

  const hasImage = isImageUrl(posterUrl)
  const lastEpisode = progress?.last_episode
  const lastRate = progress?.last_completion_rate
  const resumeEpisode = episodeFromQuery || lastEpisode

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 광고 팝업 */}
      <ShoppingAdPopup
        ads={ads}
        lastResponse={lastResponse}
        lastAlert={lastAlert}
        onAction={sendAction}
        onRemove={removeAd}
        onClearResponse={() => setLastResponse(null)}
        onClearAlert={() => setLastAlert(null)}
      />

      {/* 히어로 배너 — 포스터 또는 YouTube 플레이어 */}
      <div ref={heroRef} className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '540px' }}>
        {playing && !playerError ? (
          /* YouTube 플레이어 모드 */
          <div className="absolute inset-0 bg-black">
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-white/50">로딩 중...</div>
              </div>
            )}
            <div id="yt-hero-player" className="w-full h-full" />
            {playingEpisode && (
              <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                {playingEpisode}
              </div>
            )}
          </div>
        ) : (
          /* 포스터 모드 */
          <div className={`absolute inset-0 ${!hasImage ? `bg-gradient-to-br ${getFallbackGradient(seriesNm)}` : ''}`}>
            {hasImage && <img src={posterUrl!} alt={seriesNm} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {purchased ? (
              <div
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                onClick={() => {
                  const target = resumeEpisode || episodes[0]?.episode_title
                  if (target) playEpisode(target)
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40
                  flex items-center justify-center
                  group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/20
                  flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              </div>
            )}

            {playerError && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm">
                영상을 재생할 수 없습니다
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm
            flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 메타데이터 */}
      <div className="px-6 -mt-20 relative">
        <div className="flex gap-5">
          <div className={`w-28 h-40 rounded-xl shrink-0 shadow-xl border border-white/10 overflow-hidden
            ${!hasImage ? `bg-gradient-to-b ${getFallbackGradient(seriesNm)}` : ''}`}>
            {hasImage && <img src={posterUrl!} alt={seriesNm} className="w-full h-full object-cover" />}
          </div>

          <div className="pt-16 flex-1 min-w-0">
            <h1 className="text-white text-2xl font-bold leading-tight">{seriesNm}</h1>
            {episodes[0]?.category && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-white/50 text-xs">
                <span>{episodes[0].category}</span>
              </div>
            )}

            {lastEpisode && (
              <p className="text-blue-400 text-xs mt-2">마지막 시청: {lastEpisode} ({lastRate}%)</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={toggleWishlist}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  wishlisted
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                    : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                }`}
              >
                {wishlisted ? '♥ 찜완료' : '+ 찜하기'}
              </button>
              {purchased ? (
                <button
                  onClick={() => {
                    const target = resumeEpisode || episodes[0]?.episode_title
                    if (target) playEpisode(target)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  ▶ {resumeEpisode ? `${resumeEpisode} 이어보기` : '1화 시청하기'}
                </button>
              ) : (
                <Link
                  href={`/purchase/${encodeURIComponent(seriesNm)}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  구매하기
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 에피소드 목록 */}
        <div className="mt-8">
          <h2 className="text-white font-semibold text-base mb-3">에피소드</h2>
          <div className="space-y-2">
            {episodes.map((ep: any, idx: number) => {
              const epHasImage = isImageUrl(ep.poster_url)
              const epProgress = progress?.episodes?.find((e: any) => e.episode_title === ep.episode_title)
              const isPlaying = playingEpisode === ep.episode_title
              return (
                <div
                  key={idx}
                  ref={(el) => { episodeRefs.current[ep.episode_title] = el }}
                  onClick={() => purchased && playEpisode(ep.episode_title)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    purchased ? 'cursor-pointer' : ''
                  } ${
                    isPlaying
                      ? 'bg-blue-500/30 ring-1 ring-blue-400'
                      : activeEpisode === ep.episode_title
                        ? 'bg-blue-500/20 ring-1 ring-blue-500/40'
                        : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-16 h-10 rounded-lg shrink-0 relative overflow-hidden
                    ${!epHasImage ? `bg-gradient-to-br ${getFallbackGradient(ep.episode_title)}` : ''}`}>
                    {epHasImage && <img src={ep.poster_url} alt={ep.episode_title} className="w-full h-full object-cover" />}
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {epProgress && !isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${epProgress.completion_rate}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${isPlaying ? 'text-blue-400 font-medium' : 'text-white/80'}`}>
                      {ep.episode_title}
                    </span>
                    {ep.is_free && <span className="ml-2 text-xs text-green-400">무료</span>}
                    {isPlaying && <span className="ml-2 text-xs text-blue-400">재생 중</span>}
                    {!isPlaying && epProgress?.completion_rate === 100 && (
                      <span className="ml-2 text-xs text-blue-400">시청 완료</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
