'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { AdPopup, AdResponse, ReservationAlert } from '@/lib/useAdSocket'
import { getApiUrl } from '@/lib/api'

function resolveAdImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${getApiUrl()}/${url.replace(/^\//, '')}`
}

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
  const [toast, setToast] = useState<{ message: string; imageUrl?: string } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const autoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // 전체화면 감지
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

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
            if (ad.ad_type === 'local_gov_popup' || ad.ad_type === 'local_gov') {
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
      setToast({ message: msg })
      if (!lastResponse.error && lastResponse.vod_id) {
        // 시청예약 성공 → GNB 알림 목록 즉시 갱신 트리거
        window.dispatchEvent(new Event('refetch-notifications'))
        setTimeout(() => {
          setItems((prev) => prev.filter((i) => i.ad.vod_id !== lastResponse.vod_id))
          onRemove(lastResponse.vod_id!)
        }, 2000)
      }
      onClearResponse()
    }
  }, [lastResponse, onRemove, onClearResponse])

  // 시청예약 알림
  const SEASONAL_MARKET_LOGO = 'https://objectstorage.ap-chuncheon-1.oraclecloud.com/n/axwfwmzcuzo3/b/vod-posters/o/logos%2Fseasonal_market.jpg'

  useEffect(() => {
    if (!lastAlert) return
    setToast({
      message: lastAlert.message,
      imageUrl: lastAlert.channel === 25 ? SEASONAL_MARKET_LOGO : undefined,
    })
    onClearAlert()
  }, [lastAlert, onClearAlert])

  // 토스트 자동 제거
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ads가 비워지면 items도 동기화 (에피소드 전환 시 팝업 제거)
  useEffect(() => {
    if (ads.length === 0 && items.length > 0) {
      Object.values(autoTimers.current).forEach(clearTimeout)
      autoTimers.current = {}
      setItems([])
    }
  }, [ads, items.length])

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

  const handleWatch = useCallback((vodId: string) => {
    // 채널 25번(헬로비전 지역방송)으로 이동
    onAction('watch', vodId)
    // 팝업 닫기
    setItems((prev) => prev.filter((i) => i.ad.vod_id !== vodId))
    onRemove(vodId)
  }, [onAction, onRemove])

  const handleReserve = useCallback((vodId: string) => {
    onAction('reserve_watch', vodId)
  }, [onAction])

  const visibleItems = items.filter((i) => i.state === 'visible')
  const minimizedItems = items.filter((i) => i.state === 'minimized')
  const pos = isFullscreen ? 'fixed' : 'absolute'

  return (
    <>
      {/* 토스트 알림 */}
      {toast && (
        <div className={`${pos} top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2 rounded-lg
          bg-white/95 text-gray-900 text-sm font-medium shadow-lg
          animate-[fadeIn_0.2s_ease-out]`}>
          {toast.imageUrl && (
            <img src={toast.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 최소화된 광고 버튼들 — 플레이어 우하단 */}
      {minimizedItems.length > 0 && (
        <div className={`${pos} bottom-12 right-4 z-[55] flex flex-col gap-2`}>
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

      {/* 팝업 광고들 — 플레이어 우하단 */}
      {visibleItems.map((item, idx) => (
        <div
          key={item.ad.vod_id}
          className={`${pos} z-[55] animate-[slideUp_0.3s_ease-out]`}
          style={{ bottom: `${48 + idx * 360}px`, right: '16px' }}
        >
          {item.ad.ad_type === 'local_gov_popup' || item.ad.ad_type === 'local_gov' ? (
            <LocalGovPopup ad={item.ad} onDismiss={handleDismiss} />
          ) : (
            <SeasonalMarketPopup
              ad={item.ad}
              onWatch={handleWatch}
              onReserve={handleReserve}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      ))}
    </>
  )
}

/* ── 지자체 축제 팝업 (local_gov_popup) — GIF 520x300 + [닫기] 버튼 ── */
function LocalGovPopup({ ad, onDismiss }: { ad: AdPopup; onDismiss: (id: string) => void }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900" style={{ width: 340, maxWidth: 'calc(100vw - 32px)' }}>
      {ad.data.ad_image_url && (
        <img
          src={resolveAdImageUrl(ad.data.ad_image_url) || ''}
          alt={ad.data.product_name || '축제 광고'}
          className="w-full object-cover"
          style={{ height: 196 }}
        />
      )}
      <div className="p-2 flex justify-end">
        <button
          onClick={() => onDismiss(ad.vod_id)}
          className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

/* ── 제철장터 팝업 (seasonal_market) — 방송 중/예정 분기 ── */
function SeasonalMarketPopup({
  ad, onWatch, onReserve, onDismiss,
}: {
  ad: AdPopup
  onWatch: (id: string) => void
  onReserve: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const productName = ad.data.product_name || '상품'
  const startTime = ad.data.start_time || null
  const endTime = ad.data.end_time || null
  const broadcastDate = ad.data.broadcast_date || null

  // 방송 중 여부 판단: start_time ~ end_time 사이면 방송 중
  const isOnAir = (() => {
    if (!startTime || !endTime) return true // 시간 정보 없으면 기본 방송 중 처리
    const now = new Date()
    // 로컬 시간(KST) 기준 오늘 날짜
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`
    const start = new Date(`${broadcastDate || todayStr}T${startTime}`)
    const end = new Date(`${broadcastDate || todayStr}T${endTime}`)
    return now >= start && now <= end
  })()

  // 날짜 포맷: "3월 25일(수)" 형태
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`
  }

  return (
    <div className="w-72 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">
      <div className="p-4">
        {/* 제철장터 라벨 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
            제철장터
          </span>
          <span className="text-white/40 text-[10px]">CH 25</span>
          {isOnAir && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
              LIVE
            </span>
          )}
        </div>

        {/* 메시지 — 방송 중/예정 분기 */}
        {isOnAir ? (
          <>
            <p className="text-white text-sm leading-relaxed">
              지금 제철장터에서 {productName} 판매 중입니다.
            </p>
            <p className="text-white/70 text-sm mt-1">시청 하시겠습니까?</p>
          </>
        ) : (
          <>
            <p className="text-white text-sm leading-relaxed">
              {broadcastDate ? formatDate(broadcastDate) : ''} 제철장터에서 {productName} 판매 예정입니다.
            </p>
            {startTime && endTime && (
              <p className="text-white/50 text-xs mt-1">({startTime} ~ {endTime})</p>
            )}
            <p className="text-white/70 text-sm mt-1">시청 예약 하시겠습니까?</p>
          </>
        )}

        {/* 버튼 — 방송 중/예정 분기 */}
        <div className="flex gap-2 mt-3">
          {isOnAir ? (
            <button
              onClick={() => onWatch(ad.vod_id)}
              className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              시청 하기
            </button>
          ) : (
            <button
              onClick={() => onReserve(ad.vod_id)}
              className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              시청 예약
            </button>
          )}
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
