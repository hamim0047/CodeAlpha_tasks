import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CircleHelp,
  Database,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import ChatInput from "./components/ChatInput.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import SuggestedQuestions from "./components/SuggestedQuestions.jsx";
import TypingIndicator from "./components/TypingIndicator.jsx";

const fallbackSuggestions = [
  "Does this work with PS4?",
  "Is this compatible with Xbox One?",
  "Does the game require internet?",
  "Can two people play this game together?",
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Hello! Ask me a product question about the Video Games FAQ dataset. I’ll use NLP similarity matching to find the closest original question and return its original answer.",
  time: "Now",
};

function currentTime() {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export default function App() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] =
    useState(fallbackSuggestions);
  const [datasetInfo, setDatasetInfo] = useState({
    connected: false,
    faqCount: null,
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadBackendInfo = async () => {
      try {
        const [healthResponse, suggestionsResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/suggestions?count=4"),
        ]);

        const health = await healthResponse.json();
        const suggestions = await suggestionsResponse.json();

        if (!active) return;

        if (healthResponse.ok) {
          setDatasetInfo({
            connected: true,
            faqCount: health.faq_count ?? null,
          });
        }

        if (
          suggestionsResponse.ok &&
          Array.isArray(suggestions.suggestions) &&
          suggestions.suggestions.length
        ) {
          setSuggestedQuestions(suggestions.suggestions);
        }
      } catch {
        if (active) {
          setDatasetInfo({
            connected: false,
            faqCount: null,
          });
        }
      }
    };

    loadBackendInfo();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  const sendQuestion = async (question = input) => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || isTyping) return;

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: cleanQuestion,
        time: currentTime(),
      },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanQuestion,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an answer.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer,
          time: currentTime(),
          matched: Boolean(data.matched),
          matchedQuestion: data.matched_question || null,
          similarity:
            typeof data.similarity === "number"
              ? data.similarity
              : null,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error.message ||
            "The NLP backend is unavailable. Make sure Flask is running on port 5000.",
          time: currentTime(),
          error: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([welcomeMessage]);
    setInput("");
    setIsTyping(false);
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#06111f] px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-7">
      <div className="aurora-orb aurora-orb-one" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-two" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-three" aria-hidden="true" />
      <div className="background-grid" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-[1.75rem] border border-white/10 bg-[#0b1d2e]/75 p-5 shadow-[0_25px_80px_-38px_rgba(34,211,238,0.45)] backdrop-blur-md lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-amber-400 text-[#04111c] shadow-lg shadow-cyan-950/30">
              <Bot size={24} aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                NLP Project
              </p>
              <h1 className="text-lg font-black">FAQ Assistant</h1>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <Feature
              icon={Database}
              title="Original Dataset"
              text={
                datasetInfo.connected
                  ? `${datasetInfo.faqCount?.toLocaleString() || ""} original Video Games FAQs loaded.`
                  : "Waiting for the original FAQ dataset backend."
              }
            />

            <Feature
              icon={CircleHelp}
              title="FAQ Matching"
              text="NLTK preprocessing + TF-IDF compares each user question with the original dataset."
            />

            <Feature
              icon={ShieldCheck}
              title="Similarity Filter"
              text="Low-confidence matches are rejected instead of returning random answers."
            />
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.045] p-4 lg:mt-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-100/80">
              <span
                className={`size-2 rounded-full ${
                  datasetInfo.connected
                    ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]"
                    : "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]"
                }`}
              />
              {datasetInfo.connected
                ? "NLP backend connected"
                : "Backend disconnected"}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#091725]/80 shadow-[0_30px_100px_-45px_rgba(14,165,233,0.5)] backdrop-blur-md sm:min-h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-3rem)] lg:min-h-0">
          <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 border-b border-white/10 bg-[#091725]/92 px-4 py-4 backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-amber-400 text-[#04111c] lg:hidden">
                <Bot size={22} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate text-base font-black sm:text-lg">
                    FAQ Chatbot
                  </h2>

                  <span
                    className={`hidden rounded-full border px-2 py-1 text-[10px] font-bold sm:inline ${
                      datasetInfo.connected
                        ? "border-emerald-200/15 bg-emerald-300/[0.08] text-emerald-100"
                        : "border-amber-200/15 bg-amber-300/[0.08] text-amber-100"
                    }`}
                  >
                    {datasetInfo.connected
                      ? "Dataset Connected"
                      : "Backend Offline"}
                  </span>
                </div>

                <p className="truncate text-xs text-white/40 sm:text-sm">
                  Amazon Video Games Q&A · TF-IDF + cosine similarity
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearChat}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-xs font-bold text-white/60 transition hover:bg-cyan-300/[0.08] hover:text-cyan-50 active:scale-95 sm:text-sm"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Clear chat</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-4 sm:px-5 sm:py-5">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <div className="rounded-2xl border border-cyan-200/10 bg-gradient-to-br from-cyan-400/[0.055] via-sky-400/[0.035] to-amber-400/[0.05] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.07] text-cyan-100">
                    <Sparkles size={19} aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="font-black text-white/90">
                      Try an original dataset question
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-white/40 sm:text-sm">
                      These suggestions are loaded from the connected Video
                      Games Q&A dataset.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <SuggestedQuestions
                    questions={suggestedQuestions}
                    onSelect={sendQuestion}
                    disabled={isTyping || !datasetInfo.connected}
                  />
                </div>
              </div>

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isTyping && <TypingIndicator />}

              <div ref={chatEndRef} className="h-1" />
            </div>
          </div>

          <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#091725]/94 p-3 backdrop-blur-xl sm:p-4">
            <div className="mx-auto w-full max-w-4xl">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => sendQuestion()}
                disabled={isTyping}
              />

              <p className="mt-2 text-center text-[10px] leading-4 text-white/25 sm:text-xs">
                Answers are retrieved from the original dataset; low-similarity
                questions are rejected.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-black text-white/85">
        <Icon size={17} className="text-cyan-200" aria-hidden="true" />
        {title}
      </div>

      <p className="mt-2 text-xs leading-5 text-white/35">{text}</p>
    </div>
  );
}
