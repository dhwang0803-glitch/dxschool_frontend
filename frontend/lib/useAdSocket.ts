'use client'
import { useEffect, useRef, useCallback, useState } from 'react'

function getWsBase() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
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
        const delay = Math.min(3000 * Math.pow(2, retriesRef.current - 1), 30000)
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

  return { ads, lastResponse, lastAlert, sendPlaybackUpdate, sendAction, removeAd, setLastResponse, setLastAlert }
}
