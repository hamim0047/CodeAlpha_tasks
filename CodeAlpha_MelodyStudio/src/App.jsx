import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Download,
  Music2,
  Pause,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Waves
} from "lucide-react";
import Metric from "./components/Metric.jsx";
import StepCard from "./components/StepCard.jsx";

import * as Tone from "tone";

const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(midi) {
  const value = Number(midi);
  return `${noteNames[value % 12]}${Math.floor(value / 12) - 1}`;
}

function parseToken(token) {
  const parts = token.split(":");

  if (parts[0] === "N") {
    return {
      type: "note",
      pitches: [Number(parts[1])],
      duration: Number(parts[2]) || 0.5
    };
  }

  if (parts[0] === "C") {
    return {
      type: "chord",
      pitches: parts[1].split(".").map(Number),
      duration: Number(parts[2]) || 0.5
    };
  }

  if (parts[0] === "R") {
    return {
      type: "rest",
      pitches: [],
      duration: Number(parts[1]) || 0.5
    };
  }

  return null;
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [length, setLength] = useState(96);
  const [temperature, setTemperature] = useState(0.9);
  const [generated, setGenerated] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const activeNodesRef = useRef([]);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ ready: false }));
  }, []);

  useEffect(() => {
    return () => {
      stopPreview();

      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
    };
  }, []);

  const generate = async () => {
    setLoading(true);
    setStatus("Generating a new sequence with the trained LSTM...");
    stopPreview();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length,
          temperature
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Music generation failed.");
      }

      setGenerated(data);
      setStatus("New MIDI sequence generated successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const samplerRef = useRef(null);
  const playbackTimeoutRef = useRef(null);

  const stopPreview = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    setPlaying(false);
  };

  const getPianoSampler = async () => {
    if (samplerRef.current) {
      return samplerRef.current;
    }

    const sampler = new Tone.Sampler({
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3",
      },

      release: 1,

      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).toDestination();

    await Tone.loaded();

    samplerRef.current = sampler;

    return sampler;
  };

  const playPreview = async () => {
    if (!generated?.tokens?.length) return;

    stopPreview();

    try {
      await Tone.start();

      setStatus("Loading piano samples...");

      const sampler = await getPianoSampler();

      setPlaying(true);
      setStatus("Playing piano preview...");

      const bpm = 110;
      const secondsPerQuarter = 60 / bpm;

      let currentTime = Tone.now() + 0.15;

      generated.tokens.slice(0, 100).forEach((token) => {
        const event = parseToken(token);

        if (!event) return;

        const duration = Math.max(0.1, event.duration * secondsPerQuarter);

        if (event.type === "note") {
          const noteName = Tone.Frequency(event.pitches[0], "midi").toNote();

          sampler.triggerAttackRelease(noteName, duration, currentTime, 0.75);
        }

        if (event.type === "chord") {
          const notes = event.pitches.map((pitch) =>
            Tone.Frequency(pitch, "midi").toNote(),
          );

          sampler.triggerAttackRelease(notes, duration, currentTime, 0.65);
        }

        currentTime += duration;
      });

      const totalDuration = Math.max(0, currentTime - Tone.now()) * 1000;

      playbackTimeoutRef.current = setTimeout(() => {
        setPlaying(false);
        setStatus("Preview finished.");
      }, totalDuration + 500);
    } catch (error) {
      console.error(error);

      setPlaying(false);
      setStatus("Unable to play the piano preview.");
    }
  };

  const visibleTokens = generated?.tokens?.slice(0, 24) || [];

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#07130f] px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
      <div className="music-orb orb-one" />
      <div className="music-orb orb-two" />
      <div className="music-grid" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-5 flex items-start gap-3 sm:mb-7 sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-300 to-amber-300 text-slate-950 shadow-xl shadow-emerald-950/25 sm:size-14">
            <Music2 size={26} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[0.66rem] font-black uppercase tracking-[0.17em] text-emerald-200">
              <Sparkles size={13} />
              Deep learning music generation
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
              Neural Melody Studio
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-white/45 sm:text-sm">
              Generate new symbolic piano music from an LSTM trained on
              MAESTRO MIDI performances.
            </p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="self-start rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-200" />
              <h2 className="font-black">AI Pipeline</h2>
            </div>

            <div className="mt-4 space-y-2.5">
              <StepCard
                number="1"
                title="Collect MIDI"
                text="MAESTRO v3.0.0 classical piano MIDI dataset."
                active={Boolean(health?.dataset_ready)}
              />
              <StepCard
                number="2"
                title="Preprocess"
                text="Convert MIDI into quantized note, chord, and rest tokens."
                active={Boolean(health?.vocabulary_size)}
              />
              <StepCard
                number="3"
                title="Train LSTM"
                text="Embedding + stacked LSTM learns sequential music patterns."
                active={Boolean(health?.model_ready)}
              />
              <StepCard
                number="4"
                title="Generate"
                text="Sample new tokens and convert them back into MIDI."
                active={Boolean(generated)}
              />
            </div>
          </aside>

          <section className="min-w-0 rounded-[1.75rem] border border-white/10 bg-[#0b1d17]/80 p-4 shadow-[0_30px_100px_-45px_rgba(16,185,129,0.45)] backdrop-blur-md sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Model"
                value={health?.model_ready ? "LSTM Ready" : "Not Trained"}
              />
              <Metric
                label="Vocabulary"
                value={
                  health?.vocabulary_size
                    ? health.vocabulary_size.toLocaleString()
                    : "—"
                }
              />
              <Metric
                label="Dataset"
                value={health?.dataset_ready ? "MAESTRO" : "Missing"}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/10 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-cyan-200" />
                <h2 className="font-black">Generation Controls</h2>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/70">
                      Sequence length
                    </span>
                    <span className="rounded-lg bg-white/[0.07] px-2 py-1 text-xs font-black text-emerald-100">
                      {length} events
                    </span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="192"
                    step="8"
                    value={length}
                    onChange={(event) =>
                      setLength(Number(event.target.value))
                    }
                    className="w-full accent-emerald-300"
                  />
                </label>

                <label>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/70">
                      Temperature
                    </span>
                    <span className="rounded-lg bg-white/[0.07] px-2 py-1 text-xs font-black text-cyan-100">
                      {temperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.5"
                    step="0.05"
                    value={temperature}
                    onChange={(event) =>
                      setTemperature(Number(event.target.value))
                    }
                    className="w-full accent-cyan-300"
                  />
                  <p className="mt-2 text-[0.68rem] leading-5 text-white/30">
                    Lower = safer/repetitive. Higher = more varied/unpredictable.
                  </p>
                </label>
              </div>

              <button
                type="button"
                onClick={generate}
                disabled={loading || !health?.model_ready}
                className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300 px-5 font-black text-slate-950 shadow-lg shadow-emerald-950/35 transition hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={19} />
                ) : (
                  <Sparkles size={19} />
                )}
                {loading ? "Generating..." : "Generate New Music"}
              </button>

              {!health?.model_ready && (
                <p className="mt-3 text-center text-xs text-amber-200/65">
                  Train the model first using the backend training steps.
                </p>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Waves size={18} className="text-cyan-200" />
                    <h2 className="font-black">Generated Sequence</h2>
                  </div>
                  <p className="mt-1 text-xs text-white/35">
                    Browser preview is a lightweight synth; download the MIDI
                    for the actual symbolic output.
                  </p>
                </div>

                {generated && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={playing ? stopPreview : playPreview}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-xs font-black text-white/75 transition hover:bg-white/[0.12]"
                    >
                      {playing ? <Pause size={16} /> : <Play size={16} />}
                      {playing ? "Stop" : "Play"}
                    </button>

                    <a
                      href={generated.midi_url}
                      download
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-3 text-xs font-black text-slate-950 transition hover:brightness-105"
                    >
                      <Download size={16} />
                      MIDI
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 min-h-40 rounded-2xl border border-white/10 bg-black/15 p-3 sm:p-4">
                {visibleTokens.length ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleTokens.map((token, index) => {
                      const event = parseToken(token);
                      let label = token;

                      if (event?.type === "note") {
                        label = midiToName(event.pitches[0]);
                      }

                      if (event?.type === "chord") {
                        label = event.pitches
                          .slice(0, 3)
                          .map(midiToName)
                          .join(" · ");
                      }

                      if (event?.type === "rest") {
                        label = "Rest";
                      }

                      return (
                        <span
                          key={`${token}-${index}`}
                          className="rounded-xl border border-emerald-200/10 bg-emerald-300/[0.06] px-2.5 py-2 text-xs font-bold text-emerald-50/75"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-32 place-items-center text-center">
                    <div>
                      <Music2
                        className="mx-auto text-white/15"
                        size={34}
                      />
                      <p className="mt-2 text-sm font-bold text-white/30">
                        Your generated music will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {status && (
                <p className="mt-3 text-xs font-semibold text-white/45">
                  {status}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
