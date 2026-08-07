import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  Cpu,
  FileVideo2,
  Radar,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Square,
  Upload,
  Video,
} from "lucide-react";
import MetricCard from "./components/MetricCard.jsx";
import PipelineStep from "./components/PipelineStep.jsx";
import ObjectCounts from "./components/ObjectCounts.jsx";

const initialStats = {
  running: false,
  source_type: null,
  fps: 0,
  detections: 0,
  tracks: 0,
  counts: {},
  frame_width: 0,
  frame_height: 0,
};

export default function App() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [confidence, setConfidence] = useState(0.4);
  const [iou, setIou] = useState(0.45);
  const [status, setStatus] = useState("Choose webcam or upload a video.");
  const [busy, setBusy] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());

  const fileRef = useRef(null);

  const refreshHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setHealth(data);
    } catch {
      setHealth({ status: "offline", model_ready: false });
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) return;
        const data = await response.json();
        setStats(data);
      } catch {
        // Backend may be starting/stopping.
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, []);

  const applySettings = async (nextConfidence, nextIou) => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confidence: nextConfidence,
          iou: nextIou,
        }),
      });
    } catch {
      setStatus("Unable to update backend settings.");
    }
  };

  const onConfidence = (value) => {
    const numeric = Number(value);
    setConfidence(numeric);
    applySettings(numeric, iou);
  };

  const onIou = (value) => {
    const numeric = Number(value);
    setIou(numeric);
    applySettings(confidence, numeric);
  };

  const startWebcam = async () => {
    setBusy(true);
    setStatus("Opening webcam...");

    try {
      await applySettings(confidence, iou);

      const response = await fetch("/api/source/webcam", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not open webcam.");
      }

      setStreamKey(Date.now());
      setStatus("Webcam detection and tracking started.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadVideo = async (file) => {
    if (!file) return;

    setBusy(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      await applySettings(confidence, iou);

      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/source/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Video upload failed.");
      }

      setStreamKey(Date.now());
      setStatus(`Tracking objects in ${file.name}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const stop = async () => {
    setBusy(true);

    try {
      await fetch("/api/source/stop", { method: "POST" });
      setStats(initialStats);
      setStreamKey(Date.now());
      setStatus("Video processing stopped.");
    } catch {
      setStatus("Could not stop the source cleanly.");
    } finally {
      setBusy(false);
    }
  };

  const isOnline = health?.status === "ok";
  const modelReady = Boolean(health?.model_ready);
  const isRunning = Boolean(stats.running);

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#061018] px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
      <div className="vision-orb vision-orb-one" aria-hidden="true" />
      <div className="vision-orb vision-orb-two" aria-hidden="true" />
      <div className="vision-grid" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-5 flex items-start gap-3 sm:mb-7 sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-emerald-300 text-slate-950 shadow-xl shadow-cyan-950/30 sm:size-14">
            <Radar size={28} />
          </div>

          <div>
            <p className="flex items-center gap-2 text-[0.66rem] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Activity size={13} />
              Computer Vision Project
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
              TrackVision AI
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-white/42 sm:text-sm">
              Real-time object detection with pretrained YOLO and persistent
              object tracking IDs using SORT.
            </p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="self-start rounded-[1.75rem] border border-white/10 bg-[#0a1b26]/78 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-cyan-200" />
              <h2 className="font-black">Vision Pipeline</h2>
            </div>

            <div className="mt-4 space-y-2.5">
              <PipelineStep
                number="1"
                title="Video Input"
                text="OpenCV reads frames from a webcam or uploaded video."
                active={isRunning}
              />
              <PipelineStep
                number="2"
                title="YOLO Detection"
                text="A pretrained YOLO model detects COCO object classes."
                active={modelReady}
              />
              <PipelineStep
                number="3"
                title="SORT Tracking"
                text="Kalman filtering + IoU/Hungarian matching assigns track IDs."
                active={isRunning && stats.tracks > 0}
              />
              <PipelineStep
                number="4"
                title="Live Output"
                text="Bounding boxes, labels, confidence and IDs are rendered per frame."
                active={isRunning}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-xs font-black">
                <span
                  className={`size-2 rounded-full ${
                    isOnline
                      ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]"
                      : "bg-rose-300"
                  }`}
                />
                {isOnline ? "Backend connected" : "Backend offline"}
              </div>

              <p className="mt-2 text-xs leading-5 text-white/32">
                {health?.model_name
                  ? `Detector: ${health.model_name}`
                  : "Start Flask to load the detector."}
              </p>
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="FPS"
                value={Number(stats.fps || 0).toFixed(1)}
                hint="processed frames / sec"
              />
              <MetricCard
                label="Detections"
                value={stats.detections || 0}
                hint="YOLO detections"
              />
              <MetricCard
                label="Active Tracks"
                value={stats.tracks || 0}
                hint="SORT tracking IDs"
              />
              <MetricCard
                label="Source"
                value={
                  stats.source_type === "webcam"
                    ? "Webcam"
                    : stats.source_type === "video"
                      ? "Video"
                      : "Idle"
                }
                hint={
                  stats.frame_width
                    ? `${stats.frame_width}×${stats.frame_height}`
                    : "no active source"
                }
              />
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#081722]/84 shadow-[0_30px_100px_-45px_rgba(34,211,238,.42)] backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Video size={18} className="text-cyan-200" />
                    <h2 className="font-black">Live Detection Stream</h2>
                  </div>
                  <p className="mt-1 text-xs text-white/32">{status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !modelReady}
                    onClick={startWebcam}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                    Webcam
                  </button>

                  <button
                    type="button"
                    disabled={busy || !modelReady}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-xs font-black text-white/75 transition hover:bg-white/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Upload size={16} />
                    Upload Video
                  </button>

                  <input
                    ref={fileRef}
                    className="hidden"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mkv"
                    onChange={(event) =>
                      uploadVideo(event.target.files?.[0])
                    }
                  />

                  <button
                    type="button"
                    disabled={busy || !isRunning}
                    onClick={stop}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-300/15 bg-rose-300/[0.07] px-3 text-xs font-black text-rose-100/75 transition hover:bg-rose-300/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Square size={14} />
                    Stop
                  </button>
                </div>
              </div>

              <div className="relative aspect-video w-full overflow-hidden bg-black/35">
                {isRunning ? (
                  <img
                    key={streamKey}
                    src={`/api/stream?key=${streamKey}`}
                    alt="Real-time object detection and tracking stream"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center p-6 text-center">
                    <div>
                      <div className="mx-auto grid size-16 place-items-center rounded-3xl border border-cyan-200/10 bg-cyan-300/[0.05]">
                        <Camera size={30} className="text-cyan-100/25" />
                      </div>
                      <p className="mt-4 font-black text-white/35">
                        No active video source
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/23">
                        Start your webcam or upload a video to begin detection
                        and tracking.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <ObjectCounts counts={stats.counts} />

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2">
                  <Settings2 size={17} className="text-cyan-200" />
                  <h3 className="font-black text-white/80">Detection Settings</h3>
                </div>

                <label className="mt-4 block">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-white/50">
                      Confidence Threshold
                    </span>
                    <span className="font-black text-cyan-200">
                      {confidence.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.15"
                    max="0.9"
                    step="0.05"
                    value={confidence}
                    onChange={(event) => onConfidence(event.target.value)}
                    className="w-full accent-cyan-300"
                  />
                </label>

                <label className="mt-4 block">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-white/50">
                      YOLO IoU Threshold
                    </span>
                    <span className="font-black text-emerald-200">
                      {iou.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={iou}
                    onChange={(event) => onIou(event.target.value)}
                    className="w-full accent-emerald-300"
                  />
                </label>

                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200/10 bg-emerald-300/[0.045] p-3">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-200"
                  />
                  <p className="text-[0.68rem] leading-5 text-white/32">
                    Bounding boxes show object class, confidence score, and a
                    persistent SORT tracking ID such as <strong>#12</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
