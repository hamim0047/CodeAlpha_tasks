import { SendHorizontal } from "lucide-react";

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  maxLength = 500,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-100/10 bg-white/[0.055] p-2 shadow-inner shadow-black/20">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          placeholder="Ask a question..."
          aria-label="Ask a FAQ question"
          className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-white/30 disabled:opacity-50 sm:text-base"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-amber-400 text-[#03131f] shadow-lg shadow-cyan-950/30 transition duration-150 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          aria-label="Send question"
          title="Send"
        >
          <SendHorizontal size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pb-1 pt-1">
        <span className="hidden text-[10px] text-white/30 sm:block">
          Press Enter to send · Shift + Enter for a new line
        </span>

        <span className="ml-auto text-[10px] tabular-nums text-white/30">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
