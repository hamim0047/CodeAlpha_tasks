export default function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-white/90">{value}</div>
    </div>
  );
}
