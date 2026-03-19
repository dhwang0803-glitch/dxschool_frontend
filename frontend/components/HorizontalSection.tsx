import PosterCard from './PosterCard'
import { VOD } from '@/lib/mockData'

type Props = {
  title: string
  vods: VOD[]
}

export default function HorizontalSection({ title, vods }: Props) {
  return (
    <section className="mt-8">
      <h2 className="text-white font-semibold text-lg mb-3 px-6">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {vods.map(vod => (
          <PosterCard key={vod.series_id} vod={vod} />
        ))}
      </div>
    </section>
  )
}
