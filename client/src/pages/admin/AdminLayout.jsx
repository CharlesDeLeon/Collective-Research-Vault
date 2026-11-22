import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import ToastProvider from '../../context/ToastProvider'
import ForumProvider from '../../context/ForumProvider'
import Sidebar from '../../components/dashboard/Sidebar'
import Logo from '../../components/Logo'
import { MenuIcon } from '../../components/dashboard/icons'
import AdminDrawer from '../../components/admin/AdminDrawer'
import { ADMIN_NAV } from '../../components/admin/adminNav'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <ToastProvider>
      <ForumProvider>
        <div className="min-h-dvh bg-linear-to-br/srgb from-navy-900 to-navy-500 p-4 font-sans text-white sm:p-6 lg:flex lg:gap-6">
          <Sidebar
            user={user}
            onLogout={logout}
            navItems={ADMIN_NAV}
            roleLabel="System Admin"
            showComposer={false}
            profileTo="/admin/profile"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between font-display lg:hidden">
              <span className="flex items-center gap-2">
                <Logo className="size-9 shrink-0 text-gold" />
                <span className="text-lg font-bold tracking-wide">
                  CORE <span className="text-gold">V</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="grid size-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
              >
                <MenuIcon className="size-5" />
              </button>
            </div>
            <main className="mt-6 lg:mt-0">
              <Outlet />
            </main>
          </div>
        </div>
        <AdminDrawer open={menuOpen} onClose={closeMenu} user={user} onLogout={logout} />
      </ForumProvider>
    </ToastProvider>
  )
}