import HeroBanner from '@/components/HeroBanner'
import HorizontalSection from '@/components/HorizontalSection'
import WatchingCard from '@/components/WatchingCard'
import {
  heroBannerVODs, popularMovies, popularDramas,
  popularVariety, popularAnime, personalizedVODs, watchingItems
} from '@/lib/mockData'

export default function HomePage() {
  return (
    <main className="bg-black min-h-screen pb-16">
      <HeroBanner vods={heroBannerVODs} />

      {/* 이어보기 */}
      <section className="mt-8">
        <h2 className="text-white font-semibold text-lg mb-3 px-6">이어보기</h2>
        <div className="flex gap-3 overflow-x-auto px-6 pb-2">
          {watchingItems.map(item => (
            <WatchingCard key={item.series_id} item={item} />
          ))}
        </div>
      </section>

      <HorizontalSection title="인기 영화" vods={popularMovies} />
      <HorizontalSection title="인기 드라마" vods={popularDramas} />
      <HorizontalSection title="인기 예능" vods={popularVariety} />
      <HorizontalSection title="인기 애니메이션" vods={popularAnime} />
      <HorizontalSection title="개인화된 추천" vods={personalizedVODs} />
    </main>
  )
}
