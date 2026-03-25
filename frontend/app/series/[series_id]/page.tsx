'use client'
import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PosterCard from '@/components/PosterCard'
import { VOD, isImageUrl, getFallbackGradient } from '@/lib/types'
import { getEpisodes, getProgress, getPurchaseCheck, getSimilar, addWishlist, removeWishlist } from '@/lib/api'

export default function SeriesPage({ params }: { params: Promise<{ series_id: string }> }) {
  const { series_id } = use(params)
  const seriesNm = decodeURIComponent(series_id)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [episodes, setEpisodes] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [purchased, setPurchased] = useState(false)
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null)
  const [similar, setSimilar] = useState<VOD[]>([])
  const [wishlisted, setWishlisted] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [episodesRes, progressRes, purchaseRes] = await Promise.allSettled([
          getEpisodes(seriesNm),
          getProgress(seriesNm),
          getPurchaseCheck(seriesNm),
        ])

        if (episodesRes.status === 'fulfilled' && episodesRes.value) {
          setEpisodes(episodesRes.value.episodes || [])
          // 첫 에피소드 포스터를 시리즈 대표 포스터로 사용
          const firstEp = episodesRes.value.episodes?.[0]
          if (firstEp?.poster_url) setPosterUrl(firstEp.poster_url)
        }

        if (progressRes.status === 'fulfilled' && progressRes.value) {
          setProgress(progressRes.value)
        }

        if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
          setPurchaseInfo(purchaseRes.value)
          setPurchased(purchaseRes.value.purchased === true)
        }
      } catch (e) {
        console.error('시리즈 데이터 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seriesNm])

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

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 히어로 배너 */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '540px' }}>
        <div className={`absolute inset-0 ${!hasImage ? `bg-gradient-to-br ${getFallbackGradient(seriesNm)}` : ''}`}>
          {hasImage && <img src={posterUrl!} alt={seriesNm} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {purchased ? (
            <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
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
        </div>

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

            {/* 이어보기 진행률 */}
            {lastEpisode && (
              <p className="text-blue-400 text-xs mt-2">마지막 시청: {lastEpisode} ({lastRate}%)</p>
            )}

            {/* 버튼 */}
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
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                  ▶ {lastEpisode ? '이어보기' : '1화 시청하기'}
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
              return (
                <div
                  key={idx}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className={`w-16 h-10 rounded-lg shrink-0 relative overflow-hidden
                    ${!epHasImage ? `bg-gradient-to-br ${getFallbackGradient(ep.episode_title)}` : ''}`}>
                    {epHasImage && <img src={ep.poster_url} alt={ep.episode_title} className="w-full h-full object-cover" />}
                    {epProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${epProgress.completion_rate}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white/80">{ep.episode_title}</span>
                    {ep.is_free && <span className="ml-2 text-xs text-green-400">무료</span>}
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
