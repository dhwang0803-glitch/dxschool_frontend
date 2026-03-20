'use client'
import { useRef, useState } from 'react'
import PosterCard from './PosterCard'
import { VOD } from '@/lib/mockData'

type Props = {
  title: string
  vods: VOD[]
}

export default function HorizontalSection({ title, vods }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  return (
    <section
      className="mt-8 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h2 className="text-white font-semibold text-lg mb-3 px-6">{title}</h2>
      <div className="relative">
        {/* 왼쪽 화살표 */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-2 z-10 w-12 flex items-center justify-center
            bg-gradient-to-r from-black/80 to-transparent
            transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {vods.map(vod => (
            <PosterCard key={vod.series_id} vod={vod} />
          ))}
        </div>

        {/* 오른쪽 화살표 */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-2 z-10 w-12 flex items-center justify-center
            bg-gradient-to-l from-black/80 to-transparent
            transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
