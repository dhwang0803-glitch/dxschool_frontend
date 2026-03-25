'use client'
import { useRef, useState, useEffect } from 'react'
import HeroBanner from '@/components/HeroBanner'
import HorizontalSection from '@/components/HorizontalSection'
import WatchingCard from '@/components/WatchingCard'
import { VOD, WatchingItem } from '@/lib/types'
import { getBanner, getSections, getPersonalSections, getWatching } from '@/lib/api'

function WatchingSection({ items }: { items: WatchingItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section
      className="mt-8 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h2 className="text-white font-semibold text-xl mb-3 px-6">이어보기</h2>
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
          {items.map(item => (
            <WatchingCard key={item.series_id + item.asset_nm} item={item} />
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

export default function HomePage() {
  const [bannerVods, setBannerVods] = useState<VOD[]>([])
  const [sections, setSections] = useState<{ title: string; vods: VOD[] }[]>([])
  const [personalSections, setPersonalSections] = useState<{ title: string; vods: VOD[] }[]>([])
  const [watchingItems, setWatchingItems] = useState<WatchingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem('user_id')
      try {
        const [bannerRes, sectionsRes, watchingRes, personalRes] = await Promise.allSettled([
          getBanner(),
          getSections(),
          getWatching(),
          userId ? getPersonalSections(userId) : Promise.resolve(null),
        ])

        if (bannerRes.status === 'fulfilled' && bannerRes.value) {
          setBannerVods(bannerRes.value.items.map((item: any) => ({
            series_id: item.series_nm,
            asset_nm: item.title,
            poster_url: item.poster_url,
            ct_cl: item.category,
            score: item.score,
          })))
        }

        if (sectionsRes.status === 'fulfilled' && sectionsRes.value) {
          setSections(sectionsRes.value.sections.map((sec: any) => ({
            title: `인기 ${sec.ct_cl}`,
            vods: sec.vod_list.map((v: any) => ({
              series_id: v.series_nm,
              asset_nm: v.title,
              poster_url: v.poster_url,
              score: v.score,
            })),
          })))
        }

        if (watchingRes.status === 'fulfilled' && watchingRes.value) {
          setWatchingItems(watchingRes.value.items.map((item: any) => ({
            series_id: item.series_nm,
            asset_nm: item.episode_title,
            poster_url: item.poster_url,
            strt_dt: item.watched_at?.slice(0, 10),
            completion_rate: item.completion_rate,
          })))
        }

        if (personalRes.status === 'fulfilled' && personalRes.value) {
          setPersonalSections(personalRes.value.sections.map((sec: any) => ({
            title: `${sec.genre} 추천`,
            vods: sec.vod_list.map((v: any) => ({
              series_id: v.series_nm,
              asset_nm: v.asset_nm,
              poster_url: v.poster_url,
            })),
          })))
        }
      } catch (e) {
        console.error('홈 데이터 로드 실패:', e)
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
      <HeroBanner vods={bannerVods} />
      <WatchingSection items={watchingItems} />
      {sections.map((sec, i) => (
        <HorizontalSection key={i} title={sec.title} vods={sec.vods} />
      ))}
      {personalSections.map((sec, i) => (
        <HorizontalSection key={`personal-${i}`} title={sec.title} vods={sec.vods} />
      ))}
    </main>
  )
}
