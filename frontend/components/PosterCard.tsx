'use client'
import Link from 'next/link'
import { VOD } from '@/lib/mockData'

export default function PosterCard({ vod }: { vod: VOD }) {
  return (
    <Link href={`/series/${vod.series_id}`} className="group shrink-0 w-32">
      <div className={`w-32 h-48 rounded-lg bg-gradient-to-b ${vod.poster_url} flex items-end p-2 overflow-hidden
        group-hover:scale-105 group-hover:brightness-110 transition-all duration-200`}>
        <span className="text-white text-xs font-medium line-clamp-2 drop-shadow">{vod.asset_nm}</span>
      </div>
      <p className="mt-1.5 text-xs text-white/60 truncate">{vod.genre}</p>
    </Link>
  )
}
