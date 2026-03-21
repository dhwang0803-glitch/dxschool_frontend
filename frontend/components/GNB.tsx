'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { popularMovies, popularDramas, popularVariety, popularAnime, personalizedVODs, heroBannerVODs } from '@/lib/mockData'

const allVODs = [...heroBannerVODs, ...popularMovies, ...popularDramas, ...popularVariety, ...popularAnime, ...personalizedVODs]
  .filter((v, i, arr) => arr.findIndex(x => x.series_id === v.series_id) === i)

const reservations = [
  {
    id: 'r1',
    title: '제철장터',
    message: '2시간 후에 시작합니다',
  },
  {
    id: 'r2',
    title: '생방송 오늘저녁',
    message: '오늘 저녁 7시에 시작합니다',
  },
]

export default function GNB() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const navItems = [
    { label: '홈', href: '/' },
    { label: '스마트 추천', href: '/recommend' },
  ]

  const results = query.trim().length > 0
    ? allVODs.filter(v =>
        v.asset_nm.includes(query) ||
        v.genre?.includes(query) ||
        v.cast_lead?.includes(query) ||
        v.director?.includes(query)
      )
    : []

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="w-full px-10 flex items-center h-14">
          {/* 로고 - 왼쪽 */}
          <div className="flex-1">
            <Link href="/" className="text-white font-bold text-xl tracking-tight">
              DX<span className="text-blue-400">VOD</span>
            </Link>
          </div>

          {/* 네비게이션 탭 - 중앙 */}
          <div className="flex items-center gap-1">
            {navItems.map(({ label, href }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* 아이콘들 - 오른쪽 */}
          <div className="flex-1 flex justify-end items-center gap-5">
            {/* 검색 영역 */}
            <div className="relative flex items-center">
              {/* 검색 입력창 - 아이콘 왼쪽에 나타남 */}
              {searchOpen && (
                <div className="flex items-center gap-2 border border-white rounded-lg px-3 py-1.5 bg-black mr-3 w-52">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="제목, 사람, 장르"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40 min-w-0"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="text-white/40 hover:text-white transition-colors shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* 검색 아이콘 */}
              <button
                onClick={searchOpen ? closeSearch : openSearch}
                className={`transition-colors ${searchOpen ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              {/* 검색 결과 드롭다운 */}
              {searchOpen && results.length > 0 && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="max-h-80 overflow-y-auto">
                    {results.slice(0, 8).map(vod => (
                      <Link
                        key={vod.series_id}
                        href={`/series/${vod.series_id}`}
                        onClick={closeSearch}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-8 h-11 rounded-md bg-gradient-to-b ${vod.poster_url} shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{vod.asset_nm}</p>
                          <p className="text-white/40 text-xs mt-0.5">{vod.genre} · {vod.ct_cl}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchOpen && query.trim().length > 0 && results.length === 0 && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl px-4 py-4 z-50">
                  <p className="text-white/30 text-sm">&ldquo;{query}&rdquo; 결과 없음</p>
                </div>
              )}
            </div>

            {/* 알림 아이콘 */}
            <div className="relative">
              <button
                onClick={() => { setNotiOpen(o => !o); if (searchOpen) closeSearch() }}
                className={`relative transition-colors ${notiOpen ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {reservations.length}
                </span>
              </button>

              {/* 알림 드롭다운 */}
              {notiOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white text-sm font-semibold">알림</p>
                  </div>

                  {/* 예약된 방송 섹션 */}
                  <div className="py-1">
                    <p className="text-white/40 text-xs font-medium px-4 pt-2 pb-1">예약된 방송</p>
                    {reservations.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        {/* 이미지 자리 */}
                        <div className="w-24 h-16 rounded-lg bg-zinc-700 border border-white/10 shrink-0 flex flex-col items-center justify-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <span className="text-white/20 text-[10px]">이미지</span>
                        </div>
                        {/* 텍스트 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{r.title}</p>
                          <p className="text-white/50 text-xs mt-1 leading-relaxed">{r.message}</p>
                        </div>
                        {/* 취소 버튼 */}
                        <button className="text-white/25 hover:text-white/60 transition-colors shrink-0 self-start mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 마이페이지 아이콘 */}
            <Link href="/my" className="text-white/70 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* 배경 딤 */}
      {(searchOpen || notiOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { closeSearch(); setNotiOpen(false) }} />
      )}
    </>
  )
}
