'use client'
import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPurchaseOptions, getPoints, postPurchase } from '@/lib/api'

export default function PurchasePage({ params }: { params: Promise<{ series_id: string }> }) {
  const { series_id } = use(params)
  const seriesNm = decodeURIComponent(series_id)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<any[]>([])
  const [isFree, setIsFree] = useState(false)
  const [selected, setSelected] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [purchased, setPurchased] = useState(false)
  const [insufficientPoints, setInsufficientPoints] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [optionsRes, pointsRes] = await Promise.allSettled([
          getPurchaseOptions(seriesNm),
          getPoints(),
        ])

        if (optionsRes.status === 'fulfilled' && optionsRes.value) {
          setOptions(optionsRes.value.options || [])
          setIsFree(optionsRes.value.is_free === true)
        }

        if (pointsRes.status === 'fulfilled' && pointsRes.value) {
          setCurrentPoints(pointsRes.value.balance || 0)
        }
      } catch (e) {
        console.error('구매 옵션 로드 실패:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seriesNm])

  const handlePurchase = async () => {
    if (options.length === 0) return
    const opt = options[selected]
    if (currentPoints < opt.points) {
      setInsufficientPoints(true)
      return
    }
    try {
      const result = await postPurchase(seriesNm, opt.option_type, opt.points)
      setCurrentPoints(result.remaining_points)
      setPurchased(true)
      setTimeout(() => router.push(`/series/${encodeURIComponent(seriesNm)}`), 1500)
    } catch (e) {
      console.error('구매 실패:', e)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-white/50">로딩 중...</div>
      </div>
    )
  }

  if (isFree) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden border border-white/10 p-6 text-center">
          <p className="text-white font-semibold">무료 콘텐츠입니다</p>
          <button onClick={() => router.back()} className="mt-4 px-6 py-2 rounded-xl bg-blue-500 text-white text-sm">
            돌아가기
          </button>
        </div>
      </div>
    )
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
        <div className="px-5 py-4">
          <p className="text-white font-medium">{seriesNm}</p>
        </div>

        {/* 구매 옵션 */}
        <div className="px-5 space-y-2">
          {options.map((opt: any, i: number) => (
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
                <p className={`font-medium text-sm ${selected === i ? 'text-blue-400' : 'text-white'}`}>
                  {opt.option_type === 'rental' ? `대여 (${opt.duration})` : '영구 소장'}
                </p>
              </div>
              <span className={`font-bold ${selected === i ? 'text-blue-400' : 'text-white'}`}>
                {opt.points?.toLocaleString()} P
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
              {options[selected]?.points?.toLocaleString()}P 결제하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
