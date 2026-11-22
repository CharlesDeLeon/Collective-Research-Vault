export default function AdviserChip({ name }) {
  return name ? (
    <span className="text-white/85">{name}</span>
  ) : (
    <span className="inline-block whitespace-nowrap rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-xs font-semibold text-warn-ink">
      No adviser
    </span>
  )
}