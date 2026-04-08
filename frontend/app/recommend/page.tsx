'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import PosterCard from '@/components/PosterCard'
import { VOD, Pattern, isImageUrl, getFallbackGradient, isDevServer } from '@/lib/types'
import { getRecommend } from '@/lib/api'

/** pattern_reason 유형별 태그 라벨 */
function getReasonTag(reason: string, userId?: string | null): string {
  // 출연진 기반: "OOO 배우 출연작을", "OOO 배우가 출연한", "OOO 님 작품"
  if (/배우|출연|님\s*작품/.test(reason)) return '자주 보는 출연진의 작품'
  // 감독 기반: "OOO 감독 작품을"
  if (/감독/.test(reason)) return '최애 감독의 연출작'
  // 장르 기반: "OOO 장르를 즐겨 보셨어요"
  if (/장르/.test(reason)) return '즐겨 보는 장르'
  // 폴백
  const uid = userId ? userId.slice(0, 5) : 'user'
  return `${uid}님 맞춤 추천`
}

/** "배우" → "님" 으로 치환하여 직업 표현 통일 */
function cleanReason(reason: string): string {
  return reason
    .replace(/배우님/g, '님')
    .replace(/(\S+)\s*배우가?\s*(출연작|출연한)/g, '$1 님 $2')
}

function PatternSection({ pattern, active, userId, devMode }: { pattern: Pattern; active: boolean; userId?: string | null; devMode?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const reasonTag = getReasonTag(pattern.pattern_reason, userId)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  return (
    <section
      className={`relative ${active ? '' : 'opacity-40'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-6 mb-3 flex items-baseline gap-3">
        <h3 className="text-white font-semibold text-xl mt-1">{cleanReason(pattern.pattern_reason)}</h3>
        {devMode && pattern.tag_affinity != null && (
          <span className="text-yellow-400 text-sm font-medium">선호도 {pattern.tag_affinity.toFixed(2)}</span>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-2 z-10 w-12 flex items-center justify-center
            bg-gradient-to-r from-black/80 to-transparent
            transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pattern.vod_list.map(vod => (
            <div key={vod.series_id} className="shrink-0 w-60">
              <div className="relative">
                <PosterCard vod={vod} />
                {/* 좌측 상단 추천 이유 태그 */}
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="inline-block px-2 py-1 rounded bg-blue-500/85 text-white text-[11px] font-medium backdrop-blur-sm shadow-lg">
                    {reasonTag}
                  </span>
                </div>
                {/* dev 전용: 신뢰도 점수 */}
                {devMode && vod.score != null && (
                  <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                    <span className="inline-block px-2 py-0.5 rounded bg-black/70 text-green-400 text-[11px] font-mono backdrop-blur-sm">
                      신뢰도 {vod.score.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-2 z-10 w-12 flex items-center justify-center
            bg-gradient-to-l from-black/80 to-transparent
            transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}

export default function RecommendPage() {
  const [topVods, setTopVods] = useState<VOD[]>([])
  const [topCurrent, setTopCurrent] = useState(0)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [source, setSource] = useState<'personalized' | 'popular_fallback' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    if (topVods.length === 0) return
    const timer = setInterval(() => {
      setTopCurrent(prev => (prev + 1) % topVods.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [topVods.length])

  useEffect(() => {
    async function load() {
      const uid = localStorage.getItem('user_id')
      setUserId(uid)
      setDevMode(isDevServer())
      if (!uid) { setLoading(false); return }
      try {
        const data = await getRecommend(uid)
        if (data.source) {
          setSource(data.source)
        }
        if (data.top_vod) {
          const arr = Array.isArray(data.top_vod) ? data.top_vod : [data.top_vod]
          setTopVods(arr.map((v: any) => ({
            series_id: v.series_id,
            asset_nm: v.asset_nm,
            poster_url: v.poster_url,
            backdrop_url: v.backdrop_url ?? null,
          })))
        }
        if (data.patterns) {
          setPatterns(data.patterns.filter((p: any) => p.vod_list && p.vod_list.length >= 10).map((p: any) => ({
            pattern_rank: p.pattern_rank,
            pattern_reason: p.pattern_reason,
            tag_affinity: p.tag_affinity ?? null,
            vod_list: p.vod_list.map((v: any) => ({
              series_id: v.series_id,
              asset_nm: v.asset_nm,
              poster_url: v.poster_url,
              score: v.score,
              source_title: v.source_title ?? null,
            })),
          })))
        }
      } catch (e) {
        console.error('추천 데이터 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white/50">로딩 중...</div>
      </main>
    )
  }

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 메인 배너 — top_vod 캐러셀 (4초 자동 전환) */}
      {topVods.length > 0 && (
        <div className="relative w-full h-[50vw] min-h-[320px] max-h-[960px] overflow-hidden">
          {topVods.map((v, i) => {
            const bgUrl = v.backdrop_url || v.poster_url
            const hasImage = isImageUrl(bgUrl)
            return (
              <Link
                key={v.series_id}
                href={`/series/${encodeURIComponent(v.series_id)}`}
                className={`absolute inset-0 flex items-end transition-opacity duration-700
                  ${!hasImage ? `bg-gradient-to-br ${getFallbackGradient(v.asset_nm)}` : ''}
                  ${i === topCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={hasImage ? {
                  backgroundImage: `url("${bgUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                <div className="relative pb-16 px-10">
                  <span className={`text-xs font-semibold ${source === 'popular_fallback' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {source === 'popular_fallback' ? '지금 모두가 보고 있는 콘텐츠' : `${userId ? userId.slice(0, 5) : '회원'}님을 위해 고른 오늘의 추천`}
                  </span>
                  <h2 className="text-white text-5xl font-bold mt-1">{v.asset_nm}</h2>
                </div>
              </Link>
            )
          })}
          {topVods.length > 1 && (
            <div className="absolute bottom-6 left-10 flex gap-2 z-10">
              {topVods.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTopCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === topCurrent ? 'w-8 bg-white' : 'w-4 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
          <div className="absolute bottom-6 right-10 text-white/40 text-sm z-10">
            {topCurrent + 1} / {topVods.length}
          </div>
        </div>
      )}

      {/* 패턴 섹션들 */}
      <div className="mt-6 space-y-10">
        {patterns.map((pattern, i) => (
          <PatternSection key={i} pattern={pattern} active={true} userId={userId} devMode={devMode} />
        ))}
      </div>
    </main>
  )
}
