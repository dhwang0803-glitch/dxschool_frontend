'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VOD } from '@/lib/mockData'

export default function HeroBanner({ vods }: { vods: VOD[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % vods.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [vods.length])

  const vod = vods[current]

  return (
    <div className="relative w-full h-[480px] overflow-hidden">
      {vods.map((v, i) => (
        <div
          key={v.series_id}
          className={`absolute inset-0 bg-gradient-to-br ${v.poster_url} transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      <Link href={`/series/${vod.series_id}`} className="absolute inset-0 flex items-end pb-16 px-10">
        <div>
          <span className="text-xs text-blue-400 font-medium tracking-widest uppercase">{vod.ct_cl}</span>
          <h1 className="text-white text-5xl font-bold mt-1 mb-3">{vod.asset_nm}</h1>
          <div className="flex items-center gap-3 text-white/60 text-sm mb-3">
            <span>{vod.genre}</span>
            <span>·</span>
            <span>{vod.rating}</span>
            {vod.disp_rtm && (
              <><span>·</span><span>{vod.disp_rtm}분</span></>
            )}
          </div>
          <p className="text-white/70 text-sm max-w-lg line-clamp-2">{vod.smry}</p>
        </div>
      </Link>

      <div className="absolute bottom-6 left-10 flex gap-2">
        {vods.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-4 bg-white/30'
            }`}
          />
        ))}
      </div>
      <div className="absolute bottom-6 right-10 text-white/40 text-sm">
        {current + 1} / {vods.length}
      </div>
    </div>
  )
}
