'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { getVODById, purchasedIds, userAccount, pointHistory } from '@/lib/mockData'

const options = [
  { type: 'rental', label: '48시간 대여', points: 490 },
  { type: 'permanent', label: '영구 소장', points: 1490 },
]

export default function PurchasePage({ params }: { params: Promise<{ series_id: string }> }) {
  const { series_id } = use(params)
  const router = useRouter()
  const vod = getVODById(series_id)

  const [selected, setSelected] = useState(0)
  const [purchased, setPurchased] = useState(false)
  const [currentPoints, setCurrentPoints] = useState(userAccount.points)
  const [insufficientPoints, setInsufficientPoints] = useState(false)

  const handlePurchase = () => {
    const cost = options[selected].points
    if (userAccount.points < cost) {
      setInsufficientPoints(true)
      return
    }
    userAccount.points -= cost
    setCurrentPoints(userAccount.points)
    pointHistory.unshift({
      type: 'use',
      amount: cost,
      description: `${vod.asset_nm} ${options[selected].label}`,
      created_at: new Date().toISOString().slice(0, 10),
    })
    purchasedIds.add(series_id)
    setPurchased(true)
    setTimeout(() => router.push(`/series/${series_id}`), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden border border-white/10">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">구매하기</h2>
          <button onClick={() => router.back()} className="text-white/40 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 정보 */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className={`w-14 h-20 rounded-lg bg-gradient-to-b ${vod.poster_url} shrink-0`} />
          <div>
            <p className="text-white font-medium">{vod.asset_nm}</p>
            <p className="text-white/40 text-sm mt-0.5">{vod.genre} · {vod.rating}</p>
          </div>
        </div>

        {/* 구매 옵션 */}
        <div className="px-5 space-y-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { setSelected(i); setInsufficientPoints(false) }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                selected === i
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-left">
                <p className={`font-medium text-sm ${selected === i ? 'text-blue-400' : 'text-white'}`}>{opt.label}</p>
                {opt.type === 'rental' && <p className="text-white/40 text-xs mt-0.5">구매 후 48시간 이내 시청</p>}
              </div>
              <span className={`font-bold ${selected === i ? 'text-blue-400' : 'text-white'}`}>
                {opt.points.toLocaleString()} P
              </span>
            </button>
          ))}
        </div>

        {/* 보유 포인트 */}
        <div className="px-5 mt-4 flex items-center justify-between py-3 bg-white/5 mx-5 rounded-xl">
          <span className="text-white/50 text-sm">보유 포인트</span>
          <span className="text-white font-semibold">{currentPoints.toLocaleString()} P</span>
        </div>

        {insufficientPoints && (
          <p className="px-5 mt-2 text-red-400 text-xs text-center">포인트가 부족합니다.</p>
        )}

        {/* 결제 버튼 */}
        <div className="px-5 py-5">
          {purchased ? (
            <div className="w-full py-3.5 rounded-xl bg-green-500/20 text-green-400 text-center font-medium text-sm">
              구매 완료! 시리즈 페이지로 이동합니다...
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
            >
              {options[selected].points.toLocaleString()}P 결제하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
