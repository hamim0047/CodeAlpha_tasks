export default function ActionButton({
  icon: Icon,
  children,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/80 shadow-sm backdrop-blur-sm transition duration-150 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.13] hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 sm:px-3.5 sm:text-sm"
    >
      <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
