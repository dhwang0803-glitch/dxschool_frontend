'use client'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import HeroBanner from '@/components/HeroBanner'
import HorizontalSection from '@/components/HorizontalSection'
import WatchingCard from '@/components/WatchingCard'
import PosterCard from '@/components/PosterCard'
import { VOD, WatchingItem, isImageUrl, getFallbackGradient } from '@/lib/types'
import { getBanner, getSections, getPersonalSections, getWatching } from '@/lib/api'

/* ── Personal section 전용 타입 ── */
type PersonalVOD = VOD & {
  rank?: number | null
  rec_reason?: string | null
  rec_sentence?: string | null
}

type PersonalSection = {
  title: string
  view_ratio: number | null
  vods: PersonalVOD[]
}

/* ── 이어보기 섹션 ── */
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

/* ── TOP10 섹션 ── */
function Top10Section({ section }: { section: PersonalSection }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  return (
    <section
      className="mt-8 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h2 className="text-white font-semibold text-xl mb-3 px-6">{section.title}</h2>
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
          className="flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {section.vods.map(vod => {
            const bgUrl = vod.backdrop_url || vod.poster_url
            const hasImage = isImageUrl(bgUrl)
            return (
              <div key={vod.series_id} className="shrink-0" style={{ width: 'calc((100vw - 48px - 80px) / 4)' }}>
                <Link href={`/series/${encodeURIComponent(vod.series_id)}`} className="group block">
                  <div className="rounded-lg p-[1px] bg-gradient-to-b from-white/30 via-white/10 to-transparent">
                    <div className={`w-full aspect-video rounded-lg overflow-hidden relative
                      group-hover:scale-[1.03] group-hover:brightness-110 transition-all duration-200
                      ${!hasImage ? `bg-gradient-to-b ${getFallbackGradient(vod.asset_nm)}` : ''}`}>
                      {hasImage && (
                        <img src={bgUrl!} alt={vod.asset_nm} className="w-full h-full object-cover" />
                      )}
                      {/* Rank badge */}
                      {vod.rank != null && (
                        <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                          <span className="text-black text-lg font-extrabold leading-none">{vod.rank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                {vod.rec_sentence && (
                  <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-4">{vod.rec_sentence}</p>
                )}
              </div>
            )
          })}
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

/* ── 개인화 섹션 (view_ratio 자막 포함) ── */
function PersonalHorizontalSection({ section }: { section: PersonalSection }) {
  return (
    <div>
      <HorizontalSection title={section.title} vods={section.vods} />
      {section.view_ratio != null && section.view_ratio > 0 && (
        <p className="text-xs text-white/40 px-6 -mt-5 mb-2">
          시청 비중 {section.view_ratio}%
        </p>
      )}
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function HomePage() {
  const [bannerVods, setBannerVods] = useState<VOD[]>([])
  const [sections, setSections] = useState<{ title: string; vods: VOD[] }[]>([])
  const [personalSections, setPersonalSections] = useState<PersonalSection[]>([])
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
            backdrop_url: item.backdrop_url ?? null,
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
            title: sec.genre,
            view_ratio: sec.view_ratio ?? null,
            vods: sec.vod_list.map((v: any) => ({
              series_id: v.series_nm,
              asset_nm: v.asset_nm,
              poster_url: v.poster_url,
              backdrop_url: v.backdrop_url ?? null,
              score: v.score ?? undefined,
              rank: v.rank ?? null,
              rec_reason: v.rec_reason ?? null,
              rec_sentence: v.rec_sentence ?? null,
            })),
          })))
        }

        // API 전부 실패 시 Top10 목 데이터 (디자인 확인용, API 연결 시 제거)
        const allFailed = [bannerRes, sectionsRes, watchingRes, personalRes].every(
          r => r.status === 'rejected' || !r.value
        )
        if (allFailed) {
          const mockNames = ['검색어를 입력하세요 WWW', '썸바디', '조립식 가족', '또 오해영', '아는 형님', '시카고 타자기', '미생', '시그널', '비밀의 숲', '나의 아저씨']
          setPersonalSections([{
            title: `${userId || 'user'}님만을 위한 추천 시리즈 TOP10`,
            view_ratio: null,
            vods: mockNames.map((name, i) => ({
              series_id: `mock-${i + 1}`,
              asset_nm: name,
              poster_url: null,
              rank: i + 1,
              rec_reason: null,
              rec_sentence: null,
            })),
          }])
        }
      } catch (e) {
        console.error('홈 데이터 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /** TOP10 섹션인지 판별: vod 중 rank가 있는 항목이 존재 */
  const isTop10 = (sec: PersonalSection) =>
    sec.vods.some(v => v.rank != null)

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
      {personalSections.map((sec, i) =>
        isTop10(sec) ? (
          <Top10Section key={`personal-${i}`} section={sec} />
        ) : (
          <PersonalHorizontalSection key={`personal-${i}`} section={sec} />
        )
      )}
    </main>
  )
}
