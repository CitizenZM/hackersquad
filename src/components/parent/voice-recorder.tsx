"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Upload, Trash2, Loader2, CheckCircle2 } from "lucide-react";

const SAMPLE_SCRIPT = `Hi there! I'm so glad we're reading together tonight.
Once upon a time, in a cozy little forest, there lived a brave little bear named Milo.
He loved stars more than anything in the whole wide world.`;

const MIN_DURATION = 5; // seconds
const MAX_DURATION = 60; // seconds

type Status = "idle" | "recording" | "recorded" | "uploading" | "uploaded" | "error";

export function VoiceRecorder() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    if (audioEl.current) {
      audioEl.current.pause();
      audioEl.current = null;
    }
  }

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording isn't supported in this browser.");
      setStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setBlob(finalBlob);
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        const url = URL.createObjectURL(finalBlob);
        setBlobUrl(url);
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 0.1;
          if (next >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return next;
        });
      }, 100);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Please allow microphone access to record."
          : "Couldn't start recording."
      );
      setStatus("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function togglePreview() {
    if (!blobUrl) return;
    if (!audioEl.current) {
      audioEl.current = new Audio(blobUrl);
      audioEl.current.onended = () => setIsPreviewPlaying(false);
    }
    if (isPreviewPlaying) {
      audioEl.current.pause();
      setIsPreviewPlaying(false);
    } else {
      audioEl.current.play();
      setIsPreviewPlaying(true);
    }
  }

  function discard() {
    if (audioEl.current) {
      audioEl.current.pause();
      audioEl.current = null;
    }
    setIsPreviewPlaying(false);
    setBlob(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setElapsed(0);
    setStatus("idle");
  }

  async function upload() {
    if (!blob) return;
    setStatus("uploading");
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "voice-sample.webm");
      form.append("voiceType", "parent_recording");
      const res = await fetch("/api/voices/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      setStatus("uploaded");
      setTimeout(() => {
        router.refresh();
        discard();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const canUpload = blob && elapsed >= MIN_DURATION;
  const progress = Math.min(100, (elapsed / MAX_DURATION) * 100);

  return (
    <div className="space-y-4">
      {/* Script */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Read this out loud:
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {SAMPLE_SCRIPT}
        </p>
      </div>

      {/* Status panel */}
      <div className="rounded-lg border p-6">
        {/* Timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                status === "recording"
                  ? "bg-red-500 animate-pulse"
                  : status === "recorded" || status === "uploaded"
                  ? "bg-green-500"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {status === "recording" && "Recording…"}
              {status === "recorded" && "Review your recording"}
              {status === "uploading" && "Saving…"}
              {status === "uploaded" && "Saved!"}
              {status === "idle" && "Ready to record"}
              {status === "error" && "Something went wrong"}
            </span>
          </div>
          <span className="text-lg font-mono tabular-nums text-foreground">
            {formatTime(elapsed)} / {formatTime(MAX_DURATION)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              status === "recording" ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {status === "idle" || status === "error" ? (
            <Button onClick={startRecording} size="lg">
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          ) : null}

          {status === "recording" && (
            <Button onClick={stopRecording} size="lg" variant="destructive">
              <Square className="mr-2 h-4 w-4" fill="white" />
              Stop
            </Button>
          )}

          {status === "recorded" && (
            <>
              <Button onClick={togglePreview} size="lg" variant="outline">
                {isPreviewPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Play back
                  </>
                )}
              </Button>
              <Button onClick={discard} size="lg" variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Re-record
              </Button>
              <Button
                onClick={upload}
                size="lg"
                disabled={!canUpload}
                className="ml-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Save Voice
              </Button>
            </>
          )}

          {status === "uploading" && (
            <Button disabled size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </Button>
          )}

          {status === "uploaded" && (
            <Button disabled size="lg" variant="outline">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Saved
            </Button>
          )}
        </div>

        {!canUpload && status === "recorded" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: record at least {MIN_DURATION} seconds so we can hear your voice clearly.
          </p>
        )}
      </div>
    </div>
  );
}
