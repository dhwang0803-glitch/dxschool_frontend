'use client'
import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PosterCard from '@/components/PosterCard'
import { getVODById, getEpisodes, getSimilarVODs, wishlistIds, purchasedIds, episodeProgress, getLastWatchedEpisode } from '@/lib/mockData'

export default function SeriesPage({ params }: { params: Promise<{ series_id: string }> }) {
  const { series_id } = use(params)
  const router = useRouter()
  const vod = getVODById(series_id)
  const episodes = getEpisodes(series_id)
  const similar = getSimilarVODs(series_id)

  const [wishlisted, setWishlisted] = useState(wishlistIds.has(series_id))
  const [purchased, setPurchased] = useState(purchasedIds.has(series_id))
  const [playing, setPlaying] = useState(false)
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null)
  const [continueEpisodeId, setContinueEpisodeId] = useState<string | null>(
    () => getLastWatchedEpisode(series_id)?.episode_id ?? null
  )

  const toggleWishlist = () => {
    if (wishlisted) wishlistIds.delete(series_id)
    else wishlistIds.set(series_id, new Date().toISOString().slice(0, 10))
    setWishlisted(!wishlisted)
  }

  // 구매 페이지에서 돌아올 때 구매 상태 갱신
  useEffect(() => {
    setPurchased(purchasedIds.has(series_id))
  }, [series_id])

  const handlePlay = (episodeId?: string) => {
    if (!purchased) return
    // 재생할 에피소드 결정: 명시적 지정 > 이어보기 > 1화
    const targetId = episodeId ?? continueEpisodeId ?? episodes[0]?.episode_id ?? null
    // 에피소드 시청 기록 갱신
    if (targetId) {
      episodeProgress.set(targetId, {
        completion_rate: episodeProgress.get(targetId)?.completion_rate ?? 0,
        watched_at: new Date().toISOString(),
      })
      setContinueEpisodeId(targetId)
    }
    setActiveEpisode(targetId)
    setPlaying(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 히어로 — 플레이어 or 포스터 배너 */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '540px' }}>
        {playing && vod.youtube_id ? (
          /* YouTube iframe — 구매 후 재생 */
          <iframe
            key={activeEpisode ?? 'main'}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${vod.youtube_id}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* 포스터 배너 */
          <div className={`absolute inset-0 bg-gradient-to-br ${vod.poster_url}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {purchased ? (
              /* 구매 완료 → 재생 버튼 */
              <button
                onClick={() => handlePlay(continueEpisodeId ?? episodes[0]?.episode_id)}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40
                  flex items-center justify-center
                  group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            ) : (
              /* 미구매 → 잠금 아이콘 */
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
        )}

        {/* 뒤로 가기 버튼 */}
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
          {/* 포스터 썸네일 */}
          <div className={`w-28 h-40 rounded-xl bg-gradient-to-b ${vod.poster_url} shrink-0 shadow-xl border border-white/10`} />

          {/* 정보 */}
          <div className="pt-16 flex-1 min-w-0">
            <h1 className="text-white text-2xl font-bold leading-tight">{vod.asset_nm}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-white/50 text-xs">
              <span className="border border-white/30 rounded px-1.5 py-0.5">{vod.rating}</span>
              <span>{vod.release_year}</span>
              <span>·</span>
              <span>{vod.ct_cl}</span>
              <span>·</span>
              <span>{vod.genre}</span>
              {vod.disp_rtm && vod.ct_cl !== 'TV드라마' && vod.ct_cl !== 'TV 연예/오락' && (
                <><span>·</span><span>{vod.disp_rtm}분</span></>
              )}
            </div>

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
                <button
                  onClick={() => handlePlay(continueEpisodeId ?? episodes[0]?.episode_id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  {continueEpisodeId ? '▶ 이어보기' : '▶ 1화 시청하기'}
                </button>
              ) : (
                <Link
                  href={`/purchase/${series_id}`}
className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  구매하기
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 출연/줄거리 */}
        <div className="mt-6 space-y-2 text-sm text-white/60">
          {vod.director && <p><span className="text-white/40">감독</span> <span className="text-white/80 ml-2">{vod.director}</span></p>}
          {vod.cast_lead && <p><span className="text-white/40">출연</span> <span className="text-white/80 ml-2">{vod.cast_lead}</span></p>}
          {vod.smry && <p className="text-white/60 leading-relaxed mt-3">{vod.smry}</p>}
        </div>

        {/* 에피소드 목록 */}
        <div className="mt-8">
          <h2 className="text-white font-semibold text-base mb-3">에피소드</h2>
          <div className="space-y-2">
            {episodes.map(ep => (
              <button
                key={ep.episode_id}
                onClick={() => handlePlay(ep.episode_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left
                  ${activeEpisode === ep.episode_id && playing
                    ? 'bg-blue-500/20 border border-blue-500/40'
                    : 'bg-white/5 hover:bg-white/10'}`}
              >
                <div className={`w-16 h-10 rounded-lg bg-gradient-to-br ${ep.poster_url} shrink-0 relative`}>
                  {activeEpisode === ep.episode_id && playing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* 진행률 바 */}
                  {episodeProgress.has(ep.episode_id) && !(activeEpisode === ep.episode_id && playing) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
                      <div
                        className="h-full bg-blue-400"
                        style={{ width: `${episodeProgress.get(ep.episode_id)!.completion_rate}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${activeEpisode === ep.episode_id && playing ? 'text-blue-400' : 'text-white/80'}`}>
                    {ep.asset_nm}
                  </span>
                  {continueEpisodeId === ep.episode_id && !playing && (
                    <p className="text-blue-400 text-xs mt-0.5">이어보기</p>
                  )}
                </div>
                {activeEpisode === ep.episode_id && playing && (
                  <span className="ml-auto text-blue-400 text-xs shrink-0">재생 중</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 유사 콘텐츠 */}
        <div className="mt-10">
          <h2 className="text-white font-semibold text-base mb-3">비슷한 콘텐츠</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
            {similar.map(v => <PosterCard key={v.series_id} vod={v} />)}
          </div>
        </div>
      </div>
    </main>
  )
}
