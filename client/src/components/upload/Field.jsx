export const inputCls =
  'h-12 w-full rounded-lg border border-form-line bg-form-bg px-4 text-sm text-form-fg outline-none transition placeholder:text-form-placeholder focus:border-focus/60 focus:ring-2 focus:ring-focus/20'

export default function Field({ label, error, children }) {
  return (
    <div className="min-w-0">
      <label className="block">
        <span className="block text-sm font-bold uppercase tracking-wide text-link">{label}</span>
        <span className="mt-3 block">{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger-fg">
          {error}
        </p>
      )}
    </div>
  )
}
