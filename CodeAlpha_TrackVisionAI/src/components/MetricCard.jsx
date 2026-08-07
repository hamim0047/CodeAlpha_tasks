export default function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.15em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white/90">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/30">{hint}</p>}
    </div>
  );
}
