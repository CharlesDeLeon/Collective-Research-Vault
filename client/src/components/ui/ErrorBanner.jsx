export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
      <span className="min-w-0 wrap-break-word">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-semibold transition hover:bg-danger/15">
          Try again
        </button>
      )}
    </div>
  )
}