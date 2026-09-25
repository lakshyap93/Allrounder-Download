"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { URLInput, type OutputMode } from "@/components/features/URLInput";
import { MediaPreview } from "@/components/features/MediaPreview";
import { ProcessingStatus } from "@/components/features/ProcessingStatus";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { MediaMetadata, MediaFormat } from "@/lib/platforms/types";
import type { JobStatus } from "@/lib/queue";
import { Download, Shield, Zap, Star } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Made for speed", description: "Find a format and start your download in a few clicks." },
  { icon: Shield, title: "Private by design", description: "No account required. Temporary files are cleaned up." },
  { icon: Download, title: "Free to use", description: "No subscription or registration to get started." },
  { icon: Star, title: "10+ platforms", description: "Popular video and social platforms in one place." },
];

interface AnalysisResult {
  metadata: MediaMetadata;
  formats: MediaFormat[];
  platform: string;
  formatsError?: string;
}

interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  error?: string;
  downloadId?: string;
  filename?: string;
}

export default function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>("mp4");
  const [selectedQualityId, setSelectedQualityId] = useState("");
  const startedBrowserDownload = useRef<string | null>(null);
  const activeJobId = job && ["queued", "analyzing", "processing"].includes(job.status) ? job.id : null;

  useEffect(() => {
    if (!activeJobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch(`/api/job/${encodeURIComponent(activeJobId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check download progress.");
        if (cancelled) return;
        setJob({
          id: data.id,
          status: data.status,
          progress: data.progress ?? 0,
          error: data.error,
          downloadId: data.result?.downloadId,
          filename: data.result?.filename,
        });
      } catch (error) {
        if (!cancelled) {
          setDownloadError(error instanceof Error ? error.message : "Could not check download progress.");
          setJob((current) => current?.id === activeJobId ? { ...current, status: "failed" } : current);
        }
        return;
      }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    timer = setTimeout(poll, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeJobId]);

  useEffect(() => {
    if (job?.status !== "completed" || !job.downloadId || startedBrowserDownload.current === job.downloadId) return;
    startedBrowserDownload.current = job.downloadId;
    window.location.assign(new URL(`/api/download/${encodeURIComponent(job.downloadId)}`, window.location.origin).toString());
  }, [job?.status, job?.downloadId]);

  const handleAnalyze = useCallback(async (url: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    setJob(null);
    setSelectedQualityId("");
    setDownloadError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalyzeError(data.error || "Could not analyze this URL. Please try again.");
        return null;
      }

      const analyzed: AnalysisResult = {
        metadata: data.metadata,
        formats: data.formats,
        platform: data.platform,
        formatsError: data.formatsError,
      };
      setResult(analyzed);
      return analyzed;
    } catch {
      setAnalyzeError("Network error. Please check your connection and try again.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleURLChange = useCallback(() => {
    if (!result) return;
    setResult(null);
    setJob(null);
    setSelectedQualityId("");
    setDownloadError(null);
  }, [result]);

  const handleSelectFormat = useCallback(async (format: MediaFormat, analyzedResult: AnalysisResult | null = result) => {
    if (!analyzedResult) return;
    setDownloadError(null);
    setIsStartingDownload(true);
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: analyzedResult.metadata.originalUrl,
          formatId: format.formatId,
          container: format.container,
          platform: analyzedResult.platform,
          directDownload: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.jobId) throw new Error(data.error || "Could not start the download.");
      setJob({ id: data.jobId, status: "queued", progress: 0 });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Could not start the download.");
    } finally {
      setIsStartingDownload(false);
    }
  }, [result]);

  const handleReset = () => {
    startedBrowserDownload.current = null;
    setResult(null);
    setJob(null);
    setSelectedQualityId("");
    setAnalyzeError(null);
    setDownloadError(null);
  };

  const availableFormats = result?.formats.filter((format) =>
    outputMode === "mp4" ? format.type === "video" : format.container.toLowerCase() === "mp3"
  ) ?? [];
  const selectedFormat = availableFormats.find((format) => format.formatId === selectedQualityId) ?? availableFormats[0];
  const isJobActive = !!job && ["queued", "analyzing", "processing"].includes(job.status);
  return (
    <div className="relative overflow-hidden">
      {/* Hero section */}
      <section className="hero-shell relative flex flex-col items-center justify-center px-4 py-9 sm:py-12">
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center space-y-4 animate-fade-in">
          {!result && (
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] leading-tight text-[var(--foreground)]">
                <span className="block">Save what moves</span>
                <span className="block">you<span className="gradient-text">.</span></span>
              </h1>
              <p className="text-sm sm:text-base text-[var(--foreground-secondary)] max-w-lg mx-auto leading-relaxed">
                Paste a public video or audio link, then choose a format.
              </p>
            </div>
          )}

          {/* URL Input */}
          <div className="w-full">
            {result ? (
              <button
                onClick={handleReset}
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors underline underline-offset-4 mb-4 block mx-auto"
              >
                ← Analyze another URL
              </button>
            ) : null}
            <URLInput
              onAnalyze={handleAnalyze}
              outputMode={outputMode}
              onOutputModeChange={setOutputMode}
              onValueChange={handleURLChange}
              isLoading={isAnalyzing}
              hasResult={!!result}
              error={analyzeError}
            />
          </div>
        </div>
      </section>

      {/* Results section */}
      {result && (
        <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
          {/* Media preview */}
          <MediaPreview metadata={result.metadata} />

          {/* Select quality and download under the media preview. */}
          {availableFormats.length > 0 && (
            <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0 flex-1">
                <label htmlFor="output-quality" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                  {outputMode === "mp4" ? "Video quality" : "Audio format"}
                </label>
                <select
                  id="output-quality"
                  value={selectedFormat?.formatId ?? ""}
                  onChange={(event) => setSelectedQualityId(event.target.value)}
                  disabled={isJobActive || isStartingDownload}
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60 sm:max-w-sm"
                >
                  {availableFormats.map((format) => (
                    <option key={format.formatId} value={format.formatId}>
                      {format.label}{format.fps ? ` · ${format.fps} fps` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => selectedFormat && void handleSelectFormat(selectedFormat)}
                disabled={!selectedFormat || isJobActive || isStartingDownload}
                className="flex h-12 w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#171717] px-7 text-sm font-semibold text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-5 sm:w-52"
              >
                {isStartingDownload || isJobActive ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Opening download…</>
                ) : (
                  <><Download size={16} /> Download</>
                )}
              </button>
            </div>
          )}

          {downloadError && <ErrorMessage message={downloadError} />}

          {isStartingDownload && <ProcessingStatus status="queued" progress={0} />}
          {job && ["queued", "analyzing", "processing"].includes(job.status) && (
            <ProcessingStatus status={job.status} progress={job.progress} />
          )}
          {job?.status === "failed" && (
            <ErrorMessage message={job.error || "Processing failed. Please try a different format."} />
          )}

          {availableFormats.length === 0 && (result.formatsError || result.formats.length > 0) && (
            <ErrorMessage message={result.formatsError || `No ${outputMode.toUpperCase()} formats are available for this media.`} />
          )}
        </section>
      )}

      {/* Feature highlights */}
      {!result && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="glass-card p-5 space-y-3 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <Icon size={18} className="text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
