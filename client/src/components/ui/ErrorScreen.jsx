import Logo from '../Logo'
import ThemeToggle from '../gallery/ThemeToggle'

export default function ErrorScreen({ code, title, message, children }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-linear-to-br/srgb from-navy-900 to-navy-500 p-4 font-display text-white">
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-panel p-8 text-center shadow-lg shadow-black/20 backdrop-blur-sm sm:p-10">
        <ThemeToggle className="absolute right-4 top-4" />
        <Logo className="mx-auto size-10 sm:size-11 text-gold" />
        <p className="mt-6 text-5xl font-bold text-gold">{code}</p>
        <h1 className="mt-3 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{message}</p>
        <div className="mt-8 flex flex-col gap-3">{children}</div>
      </section>
    </main>
  )
}

export const primaryBtnCls =
  'inline-flex h-12 items-center justify-center rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-6 text-base font-semibold text-ink transition hover:brightness-105'

export const outlineBtnCls =
  'inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10'