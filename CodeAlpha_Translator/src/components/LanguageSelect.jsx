export default function LanguageSelect({
  id,
  label,
  value,
  onChange,
  languages,
  includeAuto = false,
  disabled = false,
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1.5 block text-xs font-extrabold text-white/65 sm:mb-2 sm:text-sm">
        {label}
      </span>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="min-h-11 w-full appearance-none truncate rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2.5 pr-10 text-sm font-semibold text-white outline-none backdrop-blur-sm transition duration-200 hover:border-white/25 hover:bg-white/[0.11] focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:pr-11 sm:text-base"
        >
          {includeAuto && (
            <option value="auto">Detect automatically</option>
          )}

          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
              {language.nativeName &&
                language.nativeName !== language.name &&
                ` — ${language.nativeName}`}
            </option>
          ))}
        </select>

        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45 sm:right-4"
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}
