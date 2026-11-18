import { Link } from 'react-router-dom'
import Logo from '../Logo'

export default function PublicShell({ children, wide = false }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-navy-900 to-navy-500 font-display text-white">
      <div className={`mx-auto px-4 pb-16 sm:px-8 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
        <header className="flex items-center py-4 sm:py-6">
          <Link to="/" aria-label="CORE V home" className="flex text-gold">
            <Logo className="size-10 sm:size-11" />
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}