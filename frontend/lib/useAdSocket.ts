'use client'
import { useEffect, useRef, useCallback, useState } from 'react'

function getWsBase() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL
  const releaseApiUrl = process.env.NEXT_PUBLIC_RELEASE_API_URL || ''
  const devApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  let apiUrl = devApiUrl
  if (typeof window !== 'undefined' && window.location.hostname.includes('release') && releaseApiUrl) {
    apiUrl = releaseApiUrl
  }
  return apiUrl.replace(/^http/, 'ws')
}
const WS_BASE = getWsBase()

export type AdPopup = {
  type: 'ad_popup'
  ad_type: 'local_gov_popup' | 'local_gov' | 'seasonal_market'
  vod_id: string
  time_sec: number
  data: {
    ad_image_url?: string | null
    product_name?: string | null
    channel?: string | null
    start_time?: string | null
    end_time?: string | null
    broadcast_date?: string | null
    score?: number
    [key: string]: any
  }
}

export type AdResponse = {
  type: 'ad_response'
  action: string
  vod_id?: string
  message?: string
  error?: string
}

export type ReservationAlert = {
  type: 'reservation_alert'
  channel: number
  program_name: string
  message: string
}

type ServerMessage = AdPopup | AdResponse | ReservationAlert

export function useAdSocket(userId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [ads, setAds] = useState<AdPopup[]>([])
  const [lastResponse, setLastResponse] = useState<AdResponse | null>(null)
  const [lastAlert, setLastAlert] = useState<ReservationAlert | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retriesRef = useRef(0)
  const MAX_RETRIES = 10
  const ignoreAdsUntilRef = useRef<number>(0)
  const readyForAdsRef = useRef(false) // playback_update 전송 후에만 ad 수신 허용

  const connect = useCallback(() => {
    if (!userId) return
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      wsRef.current.close()
    }
    const ws = new WebSocket(`${WS_BASE}/ad/popup?user_id=${encodeURIComponent(userId)}`)

    ws.onopen = () => {
      retriesRef.current = 0
    }

    ws.onmessage = (e) => {
      try {
        const msg: ServerMessage = JSON.parse(e.data)
        if (msg.type === 'ad_popup') {
          if (!readyForAdsRef.current || Date.now() < ignoreAdsUntilRef.current) return
          setAds((prev) => {
            if (prev.some((a) => a.vod_id === msg.vod_id)) return prev
            return [...prev, msg as AdPopup]
          })
        } else if (msg.type === 'ad_response') {
          setLastResponse(msg as AdResponse)
        } else if (msg.type === 'reservation_alert') {
          setLastAlert(msg as ReservationAlert)
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++
        const delay = Math.min(5000 * Math.pow(2, retriesRef.current - 1), 30000)
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => ws.close()

    wsRef.current = ws
  }, [userId])

  useEffect(() => {
    connect()
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendPlaybackUpdate = useCallback((vodId: string, timeSec: number) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      readyForAdsRef.current = true
      ws.send(JSON.stringify({ type: 'playback_update', vod_id: vodId, time_sec: timeSec }))
    }
  }, [])

  const sendAction = useCallback((action: string, vodId: string) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ad_action', action, vod_id: vodId }))
    }
  }, [])

  const removeAd = useCallback((vodId: string) => {
    setAds((prev) => prev.filter((a) => a.vod_id !== vodId))
  }, [])

  const clearAds = useCallback(() => {
    setAds([])
  }, [])

  // WebSocket 강제 재연결 (에피소드 전환 시 _sent_ad_ids 초기화용)
  const reconnect = useCallback(() => {
    readyForAdsRef.current = false // playback_update 전송 전까지 ad 무시
    ignoreAdsUntilRef.current = Date.now() + 5000 // 재연결 후 5초간 ad_popup 무시
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setTimeout(connect, 300)
  }, [connect])

  return { ads, lastResponse, lastAlert, sendPlaybackUpdate, sendAction, removeAd, clearAds, setLastResponse, setLastAlert, reconnect }
}
