'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { AdPopup, AdResponse, ReservationAlert } from '@/lib/useAdSocket'

type PopupState = 'visible' | 'minimized' | 'dismissed'

type AdItem = {
  ad: AdPopup
  state: PopupState
}

type Props = {
  ads: AdPopup[]
  lastResponse: AdResponse | null
  lastAlert: ReservationAlert | null
  onAction: (action: string, vodId: string) => void
  onRemove: (vodId: string) => void
  onClearResponse: () => void
  onClearAlert: () => void
}

export default function ShoppingAdPopup({
  ads, lastResponse, lastAlert, onAction, onRemove, onClearResponse, onClearAlert,
}: Props) {
  const [items, setItems] = useState<AdItem[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const autoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // 새 광고 수신 → items에 추가 + 10초 자동 최소화 타이머
  useEffect(() => {
    ads.forEach((ad) => {
      setItems((prev) => {
        if (prev.some((i) => i.ad.vod_id === ad.vod_id)) return prev
        return [...prev, { ad, state: 'visible' }]
      })

      if (!autoTimers.current[ad.vod_id]) {
        autoTimers.current[ad.vod_id] = setTimeout(() => {
          setItems((prev) => {
            const item = prev.find((i) => i.ad.vod_id === ad.vod_id)
            if (!item || item.state !== 'visible') return prev
            // 축제(local_gov)는 최소화 후 10초 뒤 자동 dismiss
            if (ad.ad_type === 'local_gov') {
              autoTimers.current[`${ad.vod_id}_dismiss`] = setTimeout(() => {
                setItems((p) => p.filter((i) => i.ad.vod_id !== ad.vod_id))
                onRemove(ad.vod_id)
                delete autoTimers.current[`${ad.vod_id}_dismiss`]
              }, 10000)
            }
            return prev.map((i) =>
              i.ad.vod_id === ad.vod_id ? { ...i, state: 'minimized' } : i
            )
          })
          delete autoTimers.current[ad.vod_id]
        }, 10000)
      }
    })
  }, [ads, onRemove])

  // 서버 응답 처리 (시청예약 성공/실패)
  useEffect(() => {
    if (!lastResponse) return
    if (lastResponse.action === 'reserve_watch') {
      const msg = lastResponse.error || lastResponse.message || '처리되었습니다'
      setToast(msg)
      if (!lastResponse.error && lastResponse.vod_id) {
        setTimeout(() => {
          setItems((prev) => prev.filter((i) => i.ad.vod_id !== lastResponse.vod_id))
          onRemove(lastResponse.vod_id!)
        }, 2000)
      }
      onClearResponse()
    }
  }, [lastResponse, onRemove, onClearResponse])

  // 시청예약 알림
  useEffect(() => {
    if (!lastAlert) return
    setToast(lastAlert.message)
    onClearAlert()
  }, [lastAlert, onClearAlert])

  // 토스트 자동 제거
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // cleanup
  useEffect(() => {
    return () => {
      Object.values(autoTimers.current).forEach(clearTimeout)
    }
  }, [])

  const handleDismiss = useCallback((vodId: string) => {
    if (autoTimers.current[vodId]) {
      clearTimeout(autoTimers.current[vodId])
      delete autoTimers.current[vodId]
    }
    setItems((prev) => prev.filter((i) => i.ad.vod_id !== vodId))
    onAction('dismiss', vodId)
    onRemove(vodId)
  }, [onAction, onRemove])

  const handleMinimize = useCallback((vodId: string) => {
    if (autoTimers.current[vodId]) {
      clearTimeout(autoTimers.current[vodId])
      delete autoTimers.current[vodId]
    }
    setItems((prev) =>
      prev.map((i) => (i.ad.vod_id === vodId ? { ...i, state: 'minimized' } : i))
    )
    onAction('minimize', vodId)
  }, [onAction])

  const handleReopen = useCallback((vodId: string) => {
    // 축제 자동 dismiss 타이머 취소
    if (autoTimers.current[`${vodId}_dismiss`]) {
      clearTimeout(autoTimers.current[`${vodId}_dismiss`])
      delete autoTimers.current[`${vodId}_dismiss`]
    }
    setItems((prev) =>
      prev.map((i) => (i.ad.vod_id === vodId ? { ...i, state: 'visible' } : i))
    )
    onAction('reopen', vodId)
  }, [onAction])

  const handleReserve = useCallback((vodId: string) => {
    onAction('reserve_watch', vodId)
  }, [onAction])

  const visibleItems = items.filter((i) => i.state === 'visible')
  const minimizedItems = items.filter((i) => i.state === 'minimized')

  return (
    <>
      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg
          bg-white/95 text-gray-900 text-sm font-medium shadow-lg
          animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* 최소화된 광고 버튼들 — 우측 하단 */}
      {minimizedItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[55] flex flex-col gap-2">
          {minimizedItems.map((item) => (
            <div key={item.ad.vod_id} className="flex gap-1.5">
              <button
                onClick={() => handleReopen(item.ad.vod_id)}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white
                  flex items-center justify-center shadow-lg transition-colors"
                title="다시 열기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => handleDismiss(item.ad.vod_id)}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white
                  flex items-center justify-center shadow-lg transition-colors"
                title="완전 제거"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 팝업 광고들 — 우측 하단 */}
      {visibleItems.map((item, idx) => (
        <div
          key={item.ad.vod_id}
          className="fixed z-[55] animate-[slideUp_0.3s_ease-out]"
          style={{ bottom: `${80 + idx * 200}px`, right: '16px' }}
        >
          {item.ad.ad_type === 'local_gov' ? (
            <LocalGovPopup ad={item.ad} onDismiss={handleDismiss} />
          ) : (
            <SeasonalMarketPopup
              ad={item.ad}
              onReserve={handleReserve}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      ))}
    </>
  )
}

/* ── 지자체 축제 팝업 (local_gov) — GIF에 축제명+일정 포함, 별도 텍스트 없음 ── */
function LocalGovPopup({ ad, onDismiss }: { ad: AdPopup; onDismiss: (id: string) => void }) {
  return (
    <div className="w-72 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">
      {ad.data.ad_image_url && (
        <img
          src={ad.data.ad_image_url}
          alt={ad.data.product_name || '축제 광고'}
          className="w-full object-contain"
        />
      )}
    </div>
  )
}

/* ── 제철장터 팝업 (seasonal_market) ── */
function SeasonalMarketPopup({
  ad, onReserve, onDismiss,
}: {
  ad: AdPopup
  onReserve: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const productName = ad.data.product_name || '상품'
  const popupText = `지금 제철장터에서 ${productName} 판매 중입니다`

  return (
    <div className="w-72 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">
      <div className="p-4">
        {/* 제철장터 라벨 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
            제철장터
          </span>
          <span className="text-white/40 text-[10px]">CH 25</span>
        </div>

        {/* 메시지 */}
        <p className="text-white text-sm leading-relaxed">{popupText}</p>

        {/* 버튼 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onReserve(ad.vod_id)}
            className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            시청 예약
          </button>
          <button
            onClick={() => onDismiss(ad.vod_id)}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
