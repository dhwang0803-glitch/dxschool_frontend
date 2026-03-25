'use client'
import Link from 'next/link'
import { VOD, isImageUrl, getFallbackGradient } from '@/lib/types'

export default function PosterCard({ vod }: { vod: VOD }) {
  const hasImage = isImageUrl(vod.poster_url)

  return (
    <Link href={`/series/${encodeURIComponent(vod.series_id)}`} className="group shrink-0 w-60">
      <div className={`w-60 h-[360px] rounded-lg overflow-hidden relative
        group-hover:scale-105 group-hover:brightness-110 transition-all duration-200
        ${!hasImage ? `bg-gradient-to-b ${getFallbackGradient(vod.asset_nm)}` : ''}`}>
        {hasImage && (
          <img src={vod.poster_url!} alt={vod.asset_nm} className="w-full h-full object-cover" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <span className="text-white text-xs font-medium line-clamp-2 drop-shadow">{vod.asset_nm}</span>
        </div>
      </div>
      {vod.genre && <p className="mt-1.5 text-xs text-white/60 truncate">{vod.genre}</p>}
    </Link>
  )
}
