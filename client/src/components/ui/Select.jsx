import { ChevronDownIcon } from '../dashboard/icons'

export default function Select({ className = '', children, ...props }) {
  return (
    <span className="relative mt-1 block">
      <select
        {...props}
        className={`h-11 w-full appearance-none rounded-lg border border-select-line bg-select-bg pl-3 pr-11 text-sm text-input-fg outline-none transition focus:border-focus/60 focus:ring-2 focus:ring-focus/20 ${className}`}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
    </span>
  )
}

export function Option({ children, ...props }) {
  return (
    <option {...props} className="bg-option-bg text-input-fg">
      {children}
    </option>
  )
}
