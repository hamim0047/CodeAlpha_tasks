import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftRight,
  Check,
  Clipboard,
  Languages,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import ActionButton from "./components/ActionButton.jsx";
import LanguageSelect from "./components/LanguageSelect.jsx";

const fallbackLanguages = [
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "bn", name: "Bangla", nativeName: "বাংলা", dir: "ltr" },
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    dir: "ltr",
  },
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
];

const maxLength = 5000;

const statusStyles = {
  error: "border-rose-300/30 bg-rose-400/10 text-rose-100",
  success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  loading: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  warning: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  idle: "border-white/10 bg-white/5 text-white/60",
};

export default function App() {
  const [languages, setLanguages] = useState(fallbackLanguages);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("bn");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const abortControllerRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/languages", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Language list unavailable.");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.languages) && data.languages.length) {
          setLanguages(data.languages);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus({
            type: "warning",
            message: "Using the built-in language list.",
          });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      window.clearTimeout(copyTimeoutRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const languageMap = useMemo(
    () => new Map(languages.map((language) => [language.code, language])),
    [languages],
  );

  const targetDirection = languageMap.get(targetLanguage)?.dir || "ltr";
  const sourceDirection =
    sourceLanguage === "auto"
      ? "auto"
      : languageMap.get(sourceLanguage)?.dir || "ltr";

  const translate = async () => {
    const cleanText = sourceText.trim();

    if (!cleanText) {
      setStatus({ type: "error", message: "Enter some text to translate." });
      return;
    }

    if (sourceLanguage !== "auto" && sourceLanguage === targetLanguage) {
      setStatus({ type: "error", message: "Choose two different languages." });
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setCopied(false);
    setStatus({ type: "loading", message: "Translating your text…" });

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          from: sourceLanguage,
          to: targetLanguage,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Translation failed.");
      }

      setTranslatedText(data.translatedText);
      setDetectedLanguage(data.detectedLanguage);
      setConfidence(data.confidence);
      setStatus({ type: "success", message: "Translation completed." });
    } catch (error) {
      if (error.name !== "AbortError") {
        setTranslatedText("");
        setDetectedLanguage(null);
        setConfidence(null);
        setStatus({
          type: "error",
          message: error.message || "Translation failed.",
        });
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const swapLanguages = () => {
    if (sourceLanguage === "auto" || isLoading) return;

    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);

    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
      setDetectedLanguage(null);
      setConfidence(null);
    }

    setStatus({ type: "idle", message: "" });
  };

  const clear = () => {
    abortControllerRef.current?.abort();
    window.clearTimeout(copyTimeoutRef.current);
    window.speechSynthesis?.cancel();

    setSourceText("");
    setTranslatedText("");
    setDetectedLanguage(null);
    setConfidence(null);
    setCopied(false);
    setIsLoading(false);
    setStatus({ type: "idle", message: "" });
  };

  const copy = async () => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);

      window.clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      setStatus({ type: "success", message: "Copied to the clipboard." });

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setStatus({ type: "error", message: "Clipboard access was blocked." });
    }
  };

  const speak = () => {
    if (!translatedText || !("speechSynthesis" in window)) {
      setStatus({ type: "error", message: "Text-to-speech is unavailable." });
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLanguage;

    utterance.onerror = () => {
      setStatus({
        type: "error",
        message: "No suitable browser voice was found.",
      });
    };

    window.speechSynthesis.speak(utterance);
    setStatus({ type: "success", message: "Playing the translation." });
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      translate();
    }
  };

  const detectedName = detectedLanguage
    ? languageMap.get(detectedLanguage)?.name || detectedLanguage
    : null;

  const entrance = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b1a] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      {/* Static background decorations: glass look without continuous GPU animation */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage:
            "radial-gradient(circle at center, black 15%, transparent 78%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.header
          {...entrance}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-7 flex items-center gap-4 sm:mb-9"
        >
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/25 bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-950/40 transition-transform duration-200 hover:rotate-3 hover:scale-105 sm:size-16">
            <Languages size={30} strokeWidth={2.2} aria-hidden="true" />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles size={14} aria-hidden="true" />
              Smart language tool
            </div>

            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-4xl">
              AuraLang Translator
            </h1>

            <p className="mt-1 text-sm text-white/55 sm:text-base">
              Translate, copy, and listen inside a smooth glass workspace.
            </p>
          </div>
        </motion.header>

        <motion.section
          {...entrance}
          transition={{ delay: reduceMotion ? 0 : 0.08, duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.075] p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-6 lg:p-8"
        >
          <div
            className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-stretch gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 transition-transform duration-200 hover:-translate-y-0.5">
              <LanguageSelect
                id="source-language"
                label="Source language"
                value={sourceLanguage}
                onChange={setSourceLanguage}
                languages={languages}
                includeAuto
                disabled={isLoading}
              />
            </div>

            <button
              type="button"
              onClick={swapLanguages}
              disabled={sourceLanguage === "auto" || isLoading}
              aria-label="Swap languages"
              title={
                sourceLanguage === "auto"
                  ? "Select a source language to swap"
                  : "Swap languages"
              }
              className="mx-auto grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan-200/25 bg-white/10 text-cyan-100 shadow-lg shadow-cyan-950/25 backdrop-blur-sm transition duration-200 hover:rotate-180 hover:scale-105 hover:bg-cyan-300/15 focus:outline-none focus:ring-4 focus:ring-cyan-300/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:rotate-0 disabled:hover:scale-100 md:mx-0"
            >
              <ArrowLeftRight size={21} strokeWidth={2.4} aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1 transition-transform duration-200 hover:-translate-y-0.5">
              <LanguageSelect
                id="target-language"
                label="Target language"
                value={targetLanguage}
                onChange={setTargetLanguage}
                languages={languages}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="relative mt-6 grid overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/10 shadow-xl shadow-black/20 lg:grid-cols-2">
            <article className="flex min-h-[350px] flex-col bg-gradient-to-br from-white/[0.08] to-cyan-300/[0.025] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200 ring-1 ring-inset ring-cyan-200/15">
                    <Sparkles size={16} aria-hidden="true" />
                  </span>

                  <h2 className="text-sm font-extrabold text-white/90">
                    Enter text
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/45">
                  {sourceText.length.toLocaleString()} /{" "}
                  {maxLength.toLocaleString()}
                </span>
              </div>

              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                dir={sourceDirection}
                placeholder="Type or paste text here…"
                aria-label="Text to translate"
                className="min-h-56 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-base leading-7 text-white shadow-inner shadow-black/10 outline-none transition duration-200 placeholder:text-white/30 focus:border-cyan-300/45 focus:bg-cyan-300/[0.06] focus:ring-4 focus:ring-cyan-300/10"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="hidden text-xs text-white/35 sm:block">
                  Ctrl/⌘ + Enter to translate
                </span>

                <div className="transition-transform duration-150 hover:-translate-y-0.5 active:scale-95">
                  <ActionButton
                    icon={RotateCcw}
                    onClick={clear}
                    disabled={!sourceText && !translatedText}
                  >
                    Clear
                  </ActionButton>
                </div>
              </div>
            </article>

            <article className="flex min-h-[350px] flex-col border-t border-white/10 bg-gradient-to-br from-fuchsia-400/[0.045] to-violet-500/[0.06] p-4 sm:p-5 lg:border-l lg:border-t-0">
              <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-fuchsia-300/10 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-200/15">
                    <Sparkles size={16} aria-hidden="true" />
                  </span>

                  <h2 className="text-sm font-extrabold text-white/90">
                    Translation
                  </h2>
                </div>

                {detectedName && (
                  <span className="max-w-[55%] text-right text-xs font-semibold text-white/45">
                    Detected: {detectedName}
                    {typeof confidence === "number" &&
                      ` · ${Math.round(confidence * 100)}%`}
                  </span>
                )}
              </div>

              <div
                tabIndex={0}
                dir={targetDirection}
                aria-label="Translated text"
                className="relative min-h-56 flex-1 overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-base leading-7 shadow-inner shadow-black/10 outline-none transition duration-200 focus:border-fuchsia-300/45 focus:ring-4 focus:ring-fuchsia-300/10"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={translatedText || "placeholder"}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion ? undefined : { opacity: 0, y: -5 }
                    }
                    transition={{ duration: 0.2 }}
                    className={
                      translatedText ? "text-white/90" : "text-white/30"
                    }
                  >
                    {translatedText || "Your translation will appear here."}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <div className="transition-transform duration-150 hover:-translate-y-0.5 active:scale-95">
                  <ActionButton
                    icon={copied ? Check : Clipboard}
                    onClick={copy}
                    disabled={!translatedText}
                  >
                    {copied ? "Copied" : "Copy"}
                  </ActionButton>
                </div>

                <div className="transition-transform duration-150 hover:-translate-y-0.5 active:scale-95">
                  <ActionButton
                    icon={Volume2}
                    onClick={speak}
                    disabled={!translatedText}
                  >
                    Listen
                  </ActionButton>
                </div>
              </div>
            </article>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {status.message && (
              <motion.div
                key={`${status.type}-${status.message}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className={`relative mt-4 flex min-h-11 items-center rounded-xl border px-3.5 py-2 text-sm font-semibold backdrop-blur-sm ${statusStyles[status.type]}`}
                role="status"
                aria-live="polite"
              >
                {status.type === "loading" && (
                  <LoaderCircle
                    className="mr-2 animate-spin"
                    size={17}
                    aria-hidden="true"
                  />
                )}

                {status.message}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={translate}
            disabled={isLoading}
            className="relative mt-4 inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 px-5 font-extrabold text-white shadow-lg shadow-violet-950/40 outline-none transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:ring-4 focus:ring-fuchsia-300/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <LoaderCircle
                className="animate-spin"
                size={21}
                aria-hidden="true"
              />
            ) : (
              <Sparkles size={20} aria-hidden="true" />
            )}

            {isLoading ? "Translating…" : "Translate text"}
          </button>
        </motion.section>

        <footer className="mt-5 text-center text-xs leading-5 text-white/35">
          Your API credentials stay on the Express server and are not exposed to
          React.
        </footer>
      </div>
    </main>
  );
}
