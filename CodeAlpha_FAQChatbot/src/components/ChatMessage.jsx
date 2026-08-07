import { Bot, User } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`message-enter flex w-full items-end gap-2.5 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.07] text-cyan-100">
          <Bot size={18} aria-hidden="true" />
        </div>
      )}

      <div
        className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg sm:max-w-[76%] sm:text-[0.95rem] ${
          isUser
            ? "rounded-br-md bg-gradient-to-br from-sky-500 to-cyan-400 text-[#03131f] shadow-cyan-950/30"
            : "rounded-bl-md border border-white/10 bg-white/[0.07] text-white/85 shadow-black/20"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        {!isUser && message.matchedQuestion && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200/70">
              {message.matched ? "Matched FAQ" : "Closest candidate"}
            </div>

            <p className="mt-1 text-xs leading-5 text-white/45">
              {message.matchedQuestion}
            </p>

            {typeof message.similarity === "number" && (
              <p className="mt-1 text-[10px] font-bold text-white/30">
                Similarity: {(message.similarity * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}

        <div
          className={`mt-1.5 text-[10px] ${
            isUser ? "text-slate-900/55" : "text-white/35"
          }`}
        >
          {message.time}
        </div>
      </div>

      {isUser && (
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] text-amber-100">
          <User size={18} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
