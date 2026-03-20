'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GNB() {
  const pathname = usePathname()

  const navItems = [
    { label: '홈', href: '/' },
    { label: '스마트 추천', href: '/recommend' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-14 gap-8">
        {/* 로고 */}
        <Link href="/" className="text-white font-bold text-xl tracking-tight shrink-0">
          DX<span className="text-blue-400">VOD</span>
        </Link>

        {/* 네비게이션 탭 */}
        <div className="flex items-center gap-1">
          {navItems.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* 마이페이지 아이콘 */}
        <Link href="/my" className="ml-auto text-white/70 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </Link>
      </div>
    </nav>
  )
}
