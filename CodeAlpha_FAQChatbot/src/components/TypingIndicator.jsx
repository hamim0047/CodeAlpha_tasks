import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="message-enter flex items-end gap-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.07] text-cyan-100">
        <Bot size={18} aria-hidden="true" />
      </div>

      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot [animation-delay:120ms]" />
          <span className="typing-dot [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
