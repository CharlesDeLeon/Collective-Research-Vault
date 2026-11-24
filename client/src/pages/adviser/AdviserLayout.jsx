import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import ToastProvider from '../../context/ToastProvider'
import ForumProvider from '../../context/ForumProvider'
import Sidebar, { MobileNav, MobileDrawer, ADVISER_NAV } from '../../components/dashboard/Sidebar'

export default function AdviserLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <ToastProvider>
      <ForumProvider>
        <div className="min-h-dvh bg-linear-to-br/srgb from-navy-900 to-navy-500 p-4 font-sans text-white sm:p-6 lg:flex lg:gap-6">
          <Sidebar
            user={user}
            onLogout={logout}
            navItems={ADVISER_NAV}
            roleLabel="Adviser"
            showComposer={false}
            profileTo="/adviser/profile"
          />
          <div className="max-w-full min-w-0 flex-1 overflow-x-clip">
            <MobileNav homeTo="/adviser/dashboard" onOpenMenu={() => setMenuOpen(true)} />
            <main className="mt-6 lg:mt-0">
              <Outlet />
            </main>
          </div>
        </div>
        <MobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={user}
          onLogout={logout}
          navItems={ADVISER_NAV}
          roleLabel="Adviser"
          profileTo="/adviser/profile"
          homeTo="/adviser/dashboard"
        />
      </ForumProvider>
    </ToastProvider>
  )
}
