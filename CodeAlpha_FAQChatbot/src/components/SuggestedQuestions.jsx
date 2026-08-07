export default function SuggestedQuestions({ questions, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="rounded-full border border-cyan-100/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-semibold text-white/65 transition duration-150 hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-cyan-300/[0.08] hover:text-cyan-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
