'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import PosterCard from '@/components/PosterCard'
import { VOD, Pattern, isImageUrl, getFallbackGradient } from '@/lib/types'
import { getRecommend } from '@/lib/api'

function PatternSection({ pattern, active }: { pattern: Pattern; active: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

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
      <div className="px-6 mb-3">
        <h3 className="text-white font-semibold text-xl mt-1">{pattern.pattern_reason}</h3>
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
            <PosterCard key={vod.series_id} vod={vod} />
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
  const [topVod, setTopVod] = useState<VOD | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [source, setSource] = useState<'personalized' | 'popular_fallback' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem('user_id')
      if (!userId) { setLoading(false); return }
      try {
        const data = await getRecommend(userId)
        if (data.source) {
          setSource(data.source)
        }
        if (data.top_vod) {
          setTopVod({
            series_id: data.top_vod.series_id,
            asset_nm: data.top_vod.asset_nm,
            poster_url: data.top_vod.poster_url,
          })
        }
        if (data.patterns) {
          setPatterns(data.patterns.map((p: any) => ({
            pattern_rank: p.pattern_rank,
            pattern_reason: p.pattern_reason,
            vod_list: p.vod_list.map((v: any) => ({
              series_id: v.series_id,
              asset_nm: v.asset_nm,
              poster_url: v.poster_url,
              score: v.score,
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

  const hasTopImage = topVod && isImageUrl(topVod.poster_url)

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 메인 배너 */}
      {topVod && (
        <Link
          href={`/series/${encodeURIComponent(topVod.series_id)}`}
          className={`relative w-full h-[480px] flex items-end overflow-hidden block
            ${!hasTopImage ? `bg-gradient-to-br ${getFallbackGradient(topVod.asset_nm)}` : ''}`}
        >
          {hasTopImage && (
            <img src={topVod.poster_url!} alt={topVod.asset_nm} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          <div className="relative pb-16 px-10">
            <span className={`text-xs font-semibold ${source === 'popular_fallback' ? 'text-amber-400' : 'text-blue-400'}`}>
              {source === 'popular_fallback' ? '지금 인기 있는 콘텐츠' : '오늘의 TOP 추천'}
            </span>
            <h2 className="text-white text-5xl font-bold mt-1">{topVod.asset_nm}</h2>
          </div>
        </Link>
      )}

      {/* 패턴 섹션들 */}
      <div className="mt-6 space-y-10">
        {patterns.map((pattern, i) => (
          <PatternSection key={i} pattern={pattern} active={true} />
        ))}
      </div>
    </main>
  )
}
