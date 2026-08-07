export default function StepCard({ number, title, text, active = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        active
          ? "border-emerald-300/25 bg-emerald-300/[0.07]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black ${
            active
              ? "bg-emerald-300 text-slate-950"
              : "bg-white/10 text-white/60"
          }`}
        >
          {number}
        </span>
        <div>
          <h3 className="text-sm font-black text-white/85">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-white/38">{text}</p>
        </div>
      </div>
    </div>
  );
}
