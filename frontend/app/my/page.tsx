'use client'
import { useState } from 'react'
import Link from 'next/link'
import { watchingItems, popularMovies, wishlistIds, getVODById, userAccount } from '@/lib/mockData'

const tabs = ['시청 내역', '구매 내역', '찜']

const purchaseHistory = popularMovies.slice(0, 5).map((v, i) => ({
  ...v,
  purchase_date: `2026-0${3 - i}-${10 + i}`,
  price: [9900, 14900, 9900, 4900, 14900][i],
  option_type: i % 2 === 0 ? '영구 소장' : '48시간 대여',
}))

export default function MyPage() {
  const [tab, setTab] = useState(0)
  const [points, setPoints] = useState(userAccount.points)
  const [wishlist, setWishlist] = useState(
    [...wishlistIds.entries()]
      .sort((a, b) => b[1].localeCompare(a[1]))
      .map(([id, date]) => ({ ...getVODById(id), wishlisted_at: date }))
  )

  return (
    <main className="bg-black min-h-screen pb-16">
      {/* 프로필 */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">황</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">황대원</h1>
              <p className="text-white/50 text-sm">프로필 전환</p>
            </div>
          </div>
          <button className="text-white/40 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 쿠폰/포인트 */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/40 text-xs">쿠폰</p>
            <p className="text-white font-bold text-lg mt-0.5">0<span className="text-white/40 text-sm font-normal">장</span></p>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/40 text-xs">포인트</p>
            <p className="text-white font-bold text-lg mt-0.5">{points.toLocaleString()}<span className="text-white/40 text-sm font-normal">P</span></p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-white/10">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              tab === i
                ? 'text-white border-b-2 border-blue-400'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 시청 내역 */}
      {tab === 0 && (
        <div className="px-6 mt-4 space-y-3">
          <p className="text-white/30 text-xs">· 최근 3개월의 시청내역만 표시되며, 종료된 콘텐츠는 노출되지 않습니다.</p>
          {watchingItems.map(item => (
            <Link key={item.series_id} href={`/series/${item.series_id}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className={`w-16 h-10 rounded-lg bg-gradient-to-br ${item.poster_url} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.asset_nm}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.strt_dt}</p>
                <div className="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.completion_rate}%` }} />
                </div>
              </div>
              <span className="text-white/30 text-xs shrink-0">{item.completion_rate}%</span>
            </Link>
          ))}
        </div>
      )}

      {/* 구매 내역 */}
      {tab === 1 && (
        <div className="px-6 mt-4 space-y-3">
          {purchaseHistory.map(item => (
            <Link key={item.series_id} href={`/series/${item.series_id}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className={`w-12 h-16 rounded-lg bg-gradient-to-b ${item.poster_url} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.asset_nm}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.purchase_date}</p>
                <p className="text-white/50 text-xs mt-0.5">{item.option_type}</p>
              </div>
              <span className="text-white/60 text-sm shrink-0">{item.price.toLocaleString()}원</span>
            </Link>
          ))}
        </div>
      )}

      {/* 찜 */}
      {tab === 2 && (
        <div className="px-6 mt-4 space-y-3">
          {wishlist.length === 0 && (
            <p className="text-white/30 text-sm text-center mt-16">찜한 콘텐츠가 없습니다.</p>
          )}
          {wishlist.map(item => (
            <div key={item.series_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <Link href={`/series/${item.series_id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-16 rounded-lg bg-gradient-to-b ${item.poster_url} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.asset_nm}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.wishlisted_at}</p>
                </div>
              </Link>
              <button
                onClick={() => {
                  wishlistIds.delete(item.series_id)
                  setWishlist(prev => prev.filter(w => w.series_id !== item.series_id))
                }}
                className="text-white/30 hover:text-pink-400 transition-colors shrink-0 p-1"
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
