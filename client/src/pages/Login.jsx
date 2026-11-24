import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { useLoginShowcase } from '../hooks/useLoginShowcase'
import Logo from '../components/Logo'
import ShowcaseBelt from '../components/login/ShowcaseBelt'
import { glass } from '../components/dashboard/constants'
import ThemeToggle from '../components/gallery/ThemeToggle'

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-12 text-sm text-white placeholder:text-white/50 transition focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20'
const iconCls = 'pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/60'
const labelCls = 'mb-1.5 block text-sm font-medium text-white/80'
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const Login = () => {
  const { login } = useAuth()
  const cards = useLoginShowcase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const response = await login(email, password, remember)
      if (response?.user?.status === 'deactivated' || response?.user?.isActive === false) {
        throw new Error('DEACTIVATED_ACCOUNT')
      }
    } catch (err) {
      if (err.message === 'DEACTIVATED_ACCOUNT' || err.message === 'INACTIVE_ACCOUNT') {
        setError('This account has been deactivated. Please contact an administrator.')
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'Access denied. Your account may be disabled.')
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 font-display text-white antialiased lg:flex-row">
      <section className="relative h-72 w-full overflow-hidden bg-linear-to-br/srgb from-navy-900 to-navy-500 lg:h-screen lg:w-[58%]">
        <div className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-navy-500/30 blur-3xl" />
        <div className="belt-dots absolute inset-0 opacity-60" />

        <ShowcaseBelt cards={cards} />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1/5 bg-linear-to-b from-navy-900/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-linear-to-t from-navy-900 via-navy-900/85 to-transparent lg:h-3/5" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-40 bg-linear-to-r from-transparent to-navy-900/60 lg:block" />

        <div className="absolute inset-x-6 top-6 z-30 flex items-center justify-between">
          <Logo className="size-10 sm:size-11 text-gold" />
          <ThemeToggle />
        </div>

        <div className="absolute inset-x-6 bottom-6 z-30 max-w-md lg:bottom-10 lg:left-8">
          <p className="m-0 hidden text-2xl font-semibold leading-snug lg:block">
            Explore student research from every field.
          </p>
          <Link
            to="/gallery"
            className="belt-pulse group mt-0 inline-flex items-center gap-4 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft py-2 pl-6 pr-2 font-semibold text-ink shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-gold/40 lg:mt-5"
          >
            Browse the gallery
            <span className="flex size-10 items-center justify-center rounded-full bg-navy-900 text-gold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </span>
          </Link>
          <p className="mb-0 ml-2 mt-3 text-sm text-white/70">Open to everyone. No login needed.</p>
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-navy-900 p-6 sm:p-12 lg:border-l lg:border-white/10">
        <div className="absolute -bottom-32 -right-24 size-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -left-24 -top-32 size-80 rounded-full bg-navy-500/30 blur-3xl" />

        <div className="relative w-full max-w-sm">
          <div className={`${glass} overflow-hidden`}>
            <div>
              <div className="p-8">
                <div className="flex items-center gap-4">
                  <Logo className="size-10 sm:size-11 shrink-0 text-gold" />
                  <div>
                    <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">Sign in</h1>
                    <p className="mb-0 mt-0.5 text-sm text-white/70">Welcome to CORE-V.</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="mt-7 space-y-5">
                  <div>
                    <label htmlFor="email" className={labelCls}>
                      Email
                    </label>
                    <div className="relative">
                      <svg {...stroke} className={iconCls}>
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputCls} pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className={labelCls}>
                      Password
                    </label>
                    <div className="relative">
                      <svg {...stroke} className={iconCls}>
                        <rect x="4" y="10" width="16" height="10" rx="3" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 px-4 text-white/60 hover:text-white focus:text-gold focus:outline-none"
                      >
                        <svg {...stroke} className="size-5">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                          {showPassword && <path d="M4 4l16 16" />}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-white/80">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="size-4 rounded accent-gold"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setInfo('Password reset is handled by your system administrator. Please contact them to reset your password.')}
                      className="text-white/80 hover:text-gold focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[0.8125rem] text-rose-200"
                    >
                      {error}
                    </div>
                  )}
                  {info && (
                    <div
                      role="status"
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[0.8125rem] text-white/80"
                    >
                      {info}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft py-3.5 font-semibold text-ink shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-gold/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Logging in...' : 'Log in'}
                    {!loading && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>

              <div className="border-t border-white/10 bg-navy-900/40 px-8 py-4 text-center text-sm text-white/70">
                No account yet? Your system administrator creates accounts. Contact them to get access.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Login