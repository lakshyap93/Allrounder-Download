"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Search, Clipboard, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OutputMode = "mp3" | "mp4";

interface URLInputProps {
  onAnalyze: (url: string) => void;
  outputMode: OutputMode;
  onOutputModeChange: (mode: OutputMode) => void;
  onValueChange?: (url: string) => void;
  isLoading?: boolean;
  hasResult?: boolean;
  error?: string | null;
}

export function URLInput({
  onAnalyze,
  outputMode,
  onOutputModeChange,
  onValueChange,
  isLoading = false,
  hasResult = false,
  error = null,
}: URLInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || hasResult) return;
    onAnalyze(trimmed);
  }, [value, isLoading, hasResult, onAnalyze]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSubmit();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateValue(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard access denied; the user can paste manually.
    }
  };

  const handleClear = () => {
    updateValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_16px_48px_rgb(25_34_62_/_8%)] sm:p-6">
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-2xl border-2 transition-all duration-200 bg-[var(--surface)]",
          focused && !error
            ? "border-[var(--primary)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
            : error
              ? "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--destructive)_10%,transparent)]"
              : "border-[var(--border)] hover:border-[var(--border-hover)]"
        )}
      >
        <div className="pl-4 text-[var(--foreground-muted)] flex-shrink-0"><Search size={20} /></div>
        <input
          ref={inputRef}
          id="url-input"
          type="url"
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste a supported video or audio URL"
          aria-label="Media URL input"
          aria-describedby={error ? "url-error" : undefined}
          aria-invalid={!!error}
          disabled={isLoading}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none disabled:opacity-50"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {value && !isLoading ? (
          <button onClick={handleClear} aria-label="Clear URL" className="mr-2 rounded-lg p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]">
            <X size={17} />
          </button>
        ) : (
          <button onClick={handlePaste} aria-label="Paste from clipboard" title="Paste from clipboard" className="mr-2 flex flex-shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition hover:text-[var(--foreground)]">
            <Clipboard size={15} /> <span className="hidden sm:inline">Paste</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-hover)] p-1" aria-label="Output format">
          {(["mp3", "mp4"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={outputMode === mode}
              onClick={() => onOutputModeChange(mode)}
              className={`rounded-full px-5 py-2 text-sm font-semibold uppercase transition ${outputMode === mode ? "bg-[#171717] text-white shadow-sm" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {!hasResult && <button
          id="analyze-button"
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          aria-label="Analyze media URL"
          className="flex h-12 w-full flex-shrink-0 items-center justify-center gap-2 rounded-full bg-[#171717] px-7 text-sm font-semibold text-white transition hover:bg-[#303030] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-45 md:ml-auto md:w-44"
        >
          {isLoading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Analyzing…</>
          ) : (
            <><Search size={16} /> Analyze</>
          )}
        </button>}
      </div>

      <p className="mt-3 text-center text-xs text-[var(--foreground-muted)]">
        {hasResult
          ? "Choose a quality below the video, then download the selected format."
          : "Choose MP3 or MP4, paste a supported link, then analyze to see available qualities."}
      </p>

      {error && (
        <div id="url-error" role="alert" className="mt-3 flex items-center gap-2 text-sm text-[var(--destructive)] animate-fade-in">
          <AlertCircle size={14} className="flex-shrink-0" /> <span>{error}</span>
        </div>
      )}
    </div>
  );
}
