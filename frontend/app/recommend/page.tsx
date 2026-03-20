'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import PosterCard from '@/components/PosterCard'
import { smartRecommendPatterns } from '@/lib/mockData'

type Pattern = typeof smartRecommendPatterns[0]

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
        <div className="flex items-center gap-2">
          <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
            패턴 {pattern.pattern_rank}
          </span>
        </div>
        <h3 className="text-white font-semibold text-base mt-1">{pattern.pattern_reason}</h3>
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

const topVod = smartRecommendPatterns[0].vod_list[0]

export default function RecommendPage() {
  const [active, setActive] = useState(0)

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 스마트 추천 헤더 */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-blue-400 text-xs font-semibold tracking-widest uppercase mb-1">AI 기반</p>
        <h1 className="text-white text-3xl font-bold">스마트 추천</h1>
        <p className="text-white/50 text-sm mt-1">나의 시청 패턴을 분석해 맞춤 콘텐츠를 추천해드려요</p>
      </div>

      {/* 메인 배너 */}
      <Link
        href={`/series/${topVod.series_id}`}
        className={`mx-6 flex items-end rounded-2xl overflow-hidden h-52 bg-gradient-to-br ${topVod.poster_url} relative`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative p-5">
          <span className="text-xs text-blue-400 font-semibold">오늘의 TOP 추천</span>
          <h2 className="text-white text-2xl font-bold mt-1">{topVod.asset_nm}</h2>
          <p className="text-white/60 text-sm mt-0.5">{topVod.genre} · {topVod.rating}</p>
        </div>
      </Link>

      {/* 패턴 탭 */}
      <div className="flex gap-2 px-6 mt-8 overflow-x-auto pb-1">
        {smartRecommendPatterns.map((p, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active === i ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            패턴 {p.pattern_rank}
          </button>
        ))}
      </div>

      {/* 패턴 섹션들 */}
      <div className="mt-6 space-y-10">
        {smartRecommendPatterns.map((pattern, i) => (
          <PatternSection key={i} pattern={pattern} active={active === i} />
        ))}
      </div>
    </main>
  )
}
