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
  const [visibleEpCount, setVisibleEpCount] = useState(20)
  const [wishlisted, setWishlisted] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [isFree, setIsFree] = useState(false)   // 전체 무료
  const [hasFree, setHasFree] = useState(false)  // 일부 무료

  // YouTube 플레이어 상태
  const [playing, setPlaying] = useState(false)
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState(false)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null)

  const playerRef = useRef<any>(null)
  const playerWrapperRef = useRef<HTMLDivElement>(null)
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
  const { ads, lastResponse, lastAlert, sendPlaybackUpdate, sendAction, removeAd, clearAds, setLastResponse, setLastAlert, reconnect } = useAdSocket(adUserId)
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentAssetIdRef = useRef<string | null>(null)
  const playbackStartTimeRef = useRef<number>(0) // 재생 시작 시각 (광고 grace period용)
  const lastSentTimeRef = useRef<number>(-1) // 마지막 전송 time_sec (seek 감지용)
  const seekGraceUntilRef = useRef<number>(0) // seek 후 grace period 끝나는 시각


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
    // 이미 타이머가 돌고 있으면 재시작하지 않음 (pause/buffer 후 resume 시 grace 리셋 방지)
    if (playbackTimerRef.current) return
    playbackTimerRef.current = setInterval(() => {
      const player = playerRef.current
      const assetId = currentAssetIdRef.current
      if (!player || !assetId) return
      // grace period 중이면 전송 안 함
      if (Date.now() < seekGraceUntilRef.current) return
      try {
        const current = player.getCurrentTime()
        if (!current) return
        const timeSec = Math.round(current)
        // seek 감지: 이전 전송 시간과 30초 이상 차이나면 seek로 판단 → 3초 grace (최초 전송 시 제외)
        if (lastSentTimeRef.current > 0 && Math.abs(timeSec - lastSentTimeRef.current) > 30) {
          seekGraceUntilRef.current = Date.now() + 3000
          lastSentTimeRef.current = timeSec
          return
        }
        lastSentTimeRef.current = timeSec
        sendPlaybackUpdate(assetId, timeSec)
      } catch { /* ignore */ }
    }, 500)
  }, [sendPlaybackUpdate])

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

  // 현재 진행률 즉시 전송 (에피소드 전환·페이지 이탈 시)
  const flushProgress = useCallback(() => {
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
    } catch { /* ignore */ }
  }, [seriesNm, updateLocalProgress])

  // YouTube 플레이어 초기화 (videoId로 히어로 영역에 재생, resumeRate가 있으면 해당 지점부터)
  const initYouTubePlayer = useCallback((videoId: string, resumeRate?: number) => {
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
      // YouTube IFrame API가 대상 div를 iframe으로 교체하므로,
      // React 렌더 트리 밖에서 DOM API로 직접 생성하여 충돌 방지
      if (playerWrapperRef.current) {
        playerWrapperRef.current.innerHTML = ''
        const el = document.createElement('div')
        el.id = 'yt-hero-player'
        el.style.width = '100%'
        el.style.height = '100%'
        playerWrapperRef.current.appendChild(el)
      }
      playerRef.current = new window.YT.Player('yt-hero-player', {
        videoId,
        playerVars: { autoplay: 1, rel: 0, fs: 0 },
        events: {
          onReady: (e: any) => {
              setPlayerLoading(false)
              // 이어보기: 진행률이 있으면 해당 지점으로 seek
              if (resumeRate && resumeRate > 0 && resumeRate < 100) {
                const duration = e.target.getDuration()
                if (duration) {
                  e.target.seekTo(Math.floor(duration * resumeRate / 100), true)
                }
              }
            },
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
    // 이전 에피소드 진행률 즉시 전송
    flushProgress()

    setPlayerError(false)
    setActiveEpisode(episodeTitle)
    setPlayingEpisode(episodeTitle)
    playingEpisodeRef.current = episodeTitle

    // 에피소드 전환: 기존 광고 + 타이머 초기화 + WebSocket 재연결 (_sent_ad_ids 리셋)
    clearAds()
    reconnect()
    stopPlaybackTimer()
    lastSentTimeRef.current = -1
    seekGraceUntilRef.current = Date.now() + 5000 // 최초 5초 grace

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
            // 해당 에피소드의 기존 진행률 조회 → 이어보기 지점 전달
            const epProgress = progress?.episodes?.find((e: any) => e.episode_title === episodeTitle)
            initYouTubePlayer(videoId, epProgress?.completion_rate)
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
  }, [episodes, progress, initYouTubePlayer])

  // 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const [episodesRes, progressRes, purchaseRes, similarRes] = await Promise.allSettled([
          getEpisodes(seriesNm),
          getProgress(seriesNm),
          getPurchaseCheck(seriesNm),
          getSimilar(seriesNm),
        ])

        let loadedEpisodes: any[] = []

        if (episodesRes.status === 'fulfilled' && episodesRes.value) {
          loadedEpisodes = (episodesRes.value.episodes || []).sort((a: any, b: any) => {
            const numA = parseInt(a.episode_title.replace(/[^0-9]/g, ''), 10) || 0
            const numB = parseInt(b.episode_title.replace(/[^0-9]/g, ''), 10) || 0
            return numA - numB
          })
          setEpisodes(loadedEpisodes)
          // 무료 에피소드 판별
          const freeEps = loadedEpisodes.filter((ep: any) => ep.is_free)
          if (freeEps.length > 0) {
            setHasFree(true)
            if (freeEps.length === loadedEpisodes.length) setIsFree(true)
          }
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
        // 무료 시리즈는 구매 없이 시청 가능
        const allFree = loadedEpisodes.length > 0 && loadedEpisodes.every((ep: any) => ep.is_free)
        setPurchased(purchaseCheckOk || hasProgress || fromWatching || allFree)
        if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
          setPurchaseInfo(purchaseRes.value)
        }

        if (similarRes.status === 'fulfilled' && similarRes.value) {
          const items = similarRes.value.items || similarRes.value
          setSimilar((Array.isArray(items) ? items : []).map((v: any) => ({
            series_id: v.series_id || v.series_nm,
            asset_nm: v.asset_nm,
            poster_url: v.poster_url,
            score: v.score,
          })))
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

  // 페이지 이탈 시 진행률 즉시 전송 (브라우저 탭 닫기, 새로고침)
  useEffect(() => {
    const handleBeforeUnload = () => flushProgress()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [flushProgress])

  // cleanup (SPA 내 페이지 전환)
  useEffect(() => {
    return () => {
      flushProgress()
      stopHeartbeat()
      stopPlaybackTimer()
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [flushProgress, stopHeartbeat, stopPlaybackTimer])

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
      {/* 히어로 배너 — 포스터 또는 YouTube 플레이어 */}
      <div ref={heroRef} className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '540px' }}>
        {playing && !playerError ? (
          /* YouTube 플레이어 모드 — 컨테이너 전체화면 (팝업 오버레이 유지) */
          <div id="player-container" className="absolute inset-0 bg-black">
            <div className={`absolute inset-0 flex items-center justify-center z-10 ${playerLoading ? '' : 'hidden'}`}>
              <div className="text-white/50">로딩 중...</div>
            </div>
            <div ref={playerWrapperRef} className="absolute inset-0" />
            {playingEpisode && (
              <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                {playingEpisode}
              </div>
            )}
            {/* 커스텀 전체화면 버튼 */}
            <button
              onClick={() => {
                const container = document.getElementById('player-container')
                if (!container) return
                if (document.fullscreenElement) {
                  document.exitFullscreen()
                } else {
                  container.requestFullscreen()
                }
              }}
              className="absolute bottom-3 right-3 z-[56] w-8 h-8 rounded bg-black/60 hover:bg-black/80
                flex items-center justify-center text-white/70 hover:text-white transition-colors"
              title="전체화면"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
            {/* 광고 팝업 — 플레이어 안쪽 */}
            <ShoppingAdPopup
              key={playingEpisode || 'none'}
              ads={ads}
              lastResponse={lastResponse}
              lastAlert={lastAlert}
              onAction={sendAction}
              onRemove={removeAd}
              onClearResponse={() => setLastResponse(null)}
              onClearAlert={() => setLastAlert(null)}
            />
          </div>
        ) : (
          /* 포스터 모드 */
          <div className={`absolute inset-0 bg-gradient-to-br ${getFallbackGradient(seriesNm)}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {purchased || isFree ? (
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
              {purchased || isFree ? (
                <button
                  onClick={() => {
                    const target = resumeEpisode || episodes[0]?.episode_title
                    if (target) playEpisode(target)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  ▶ {resumeEpisode ? `${resumeEpisode} 이어보기` : isFree ? '시청하기' : '1화 시청하기'}
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

        {/* 에피소드 목록 (20개씩 더보기) */}
        <div className="mt-8">
          <h2 className="text-white font-semibold text-base mb-3">
            에피소드 <span className="text-white/40 text-sm font-normal ml-1">{episodes.length}개</span>
          </h2>
          <div className="space-y-2">
            {episodes.slice(0, visibleEpCount).map((ep: any, idx: number) => {
              const epHasImage = isImageUrl(ep.poster_url)
              const epProgress = progress?.episodes?.find((e: any) => e.episode_title === ep.episode_title)
              const isPlaying = playingEpisode === ep.episode_title
              return (
                <div
                  key={idx}
                  ref={(el) => { episodeRefs.current[ep.episode_title] = el }}
                  onClick={() => (purchased || ep.is_free) && playEpisode(ep.episode_title)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    purchased || ep.is_free ? 'cursor-pointer' : ''
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
                    {!purchased && !ep.is_free && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 inline w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                    {isPlaying && <span className="ml-2 text-xs text-blue-400">재생 중</span>}
                    {!isPlaying && epProgress?.completion_rate === 100 && (
                      <span className="ml-2 text-xs text-blue-400">시청 완료</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {visibleEpCount < episodes.length && (
            <button
              onClick={() => setVisibleEpCount(prev => prev + 20)}
              className="w-full mt-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
                text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              더보기 ({visibleEpCount}/{episodes.length})
            </button>
          )}
        </div>

        {/* 관련 콘텐츠 */}
        {similar.length > 0 && (
          <div className="mt-10">
            <h2 className="text-white font-semibold text-base mb-3">관련 콘텐츠</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {similar.map(vod => (
                <div key={vod.series_id} className="shrink-0 w-60">
                  <PosterCard vod={vod} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
