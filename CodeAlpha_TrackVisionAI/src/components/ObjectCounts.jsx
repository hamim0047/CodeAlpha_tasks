export default function ObjectCounts({ counts = {} }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-white/80">Objects in Frame</h3>
        <span className="text-xs font-bold text-cyan-200/70">
          {entries.reduce((sum, [, count]) => sum + count, 0)} tracked
        </span>
      </div>

      <div className="mt-3 flex min-h-10 flex-wrap gap-2">
        {entries.length ? (
          entries.map(([name, count]) => (
            <span
              key={name}
              className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-2 text-xs font-bold text-cyan-50/75"
            >
              {name} <strong className="ml-1 text-cyan-200">{count}</strong>
            </span>
          ))
        ) : (
          <p className="text-xs text-white/28">No tracked objects yet.</p>
        )}
      </div>
    </div>
  );
}
