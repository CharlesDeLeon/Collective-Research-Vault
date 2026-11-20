import { Outlet } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import ToastProvider from '../../context/ToastProvider'
import ForumProvider from '../../context/ForumProvider'
import Sidebar, { BottomNav, MobileNav } from '../../components/dashboard/Sidebar'
import { ADVISER_NAV, ADVISER_BOTTOM } from '../../components/dashboard/Sidebar'

export default function AdviserLayout() {
  const { user, logout } = useAuth()

  return (
    <ToastProvider>
      <ForumProvider>
        <div className="min-h-dvh bg-linear-to-br/srgb from-navy-900 to-navy-500 p-4 pb-24 font-sans text-white sm:p-6 sm:pb-24 lg:flex lg:gap-6 lg:pb-6">
          <Sidebar
            user={user}
            onLogout={logout}
            navItems={ADVISER_NAV}
            bottomItems={ADVISER_BOTTOM}
            roleLabel="Adviser"
            showComposer={false}
          />
          <div className="min-w-0 flex-1">
            <MobileNav />
            <main className="mt-6 lg:mt-0">
              <Outlet />
            </main>
          </div>
        </div>
        <BottomNav items={ADVISER_BOTTOM} />
      </ForumProvider>
    </ToastProvider>
  )
}