'use client'
import Link from 'next/link'
import { WatchingItem, isImageUrl, getFallbackGradient } from '@/lib/types'

export default function WatchingCard({ item }: { item: WatchingItem }) {
  const hasImage = isImageUrl(item.poster_url)

  return (
    <Link href={`/series/${encodeURIComponent(item.series_id)}`} className="group shrink-0 w-60">
      <div className={`w-60 h-40 rounded-lg overflow-hidden relative
        group-hover:brightness-110 transition-all duration-200
        ${!hasImage ? `bg-gradient-to-br ${getFallbackGradient(item.asset_nm)}` : ''}`}>
        {hasImage && (
          <img src={item.poster_url!} alt={item.asset_nm} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <span className="absolute bottom-2 left-2 text-white text-xs font-medium line-clamp-1 drop-shadow">
          {item.asset_nm}
        </span>
      </div>
      <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.completion_rate}%` }} />
      </div>
      <p className="mt-1 text-xs text-white/50">{item.completion_rate}% 시청</p>
    </Link>
  )
}
