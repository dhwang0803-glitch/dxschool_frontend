import Link from 'next/link'
import { WatchingItem } from '@/lib/mockData'

export default function WatchingCard({ item }: { item: WatchingItem }) {
  return (
    <Link href={`/series/${item.series_id}`} className="group shrink-0 w-36">
      <div className={`w-36 h-24 rounded-lg bg-gradient-to-br ${item.poster_url} overflow-hidden relative
        group-hover:brightness-110 transition-all duration-200`}>
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
