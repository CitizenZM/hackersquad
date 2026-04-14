"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera, X, Loader2, CheckCircle2, ImageIcon } from "lucide-react";

const STYLES = [
  { id: "friendly", label: "Friendly", emoji: "😊", filter: "saturate(1.15) contrast(1.08) brightness(1.05)" },
  { id: "adventurous", label: "Adventurous", emoji: "🦊", filter: "saturate(1.3) contrast(1.15) hue-rotate(-8deg)" },
  { id: "dreamy", label: "Dreamy", emoji: "🌙", filter: "saturate(1.1) contrast(0.95) brightness(1.1) hue-rotate(8deg)" },
  { id: "playful", label: "Playful", emoji: "🎈", filter: "saturate(1.4) contrast(1.2) brightness(1.05)" },
];

type Status = "idle" | "camera" | "preview" | "uploading" | "uploaded" | "error";

export function AvatarUploader() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [styleId, setStyleId] = useState("friendly");
  const [name, setName] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setImageFile(file);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setStatus("preview");
    setError(null);
  }, [imageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      setStatus("camera");
      // Wait one frame for the video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setError("Please allow camera access to take a photo.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("idle");
  }

  function snapPhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.png", { type: "image/png" });
      stopCamera();
      onDrop([file]);
    }, "image/png");
  }

  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageFile(null);
    setStatus("idle");
    setError(null);
    setName("");
  }

  async function upload() {
    if (!imageFile) return;
    setStatus("uploading");
    setError(null);
    try {
      const form = new FormData();
      form.append("image", imageFile);
      form.append("cartoonStyle", styleId);
      if (name.trim()) form.append("assignedName", name.trim());
      const res = await fetch("/api/avatars/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      setStatus("uploaded");
      setTimeout(() => {
        router.refresh();
        reset();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  const style = STYLES.find((s) => s.id === styleId) || STYLES[0];

  return (
    <div className="space-y-5">
      {/* Step 1: image source */}
      {status === "idle" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:bg-accent/30"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Upload photo</p>
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP</p>
          </div>
          <button
            onClick={startCamera}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:bg-accent/30"
          >
            <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Take a photo</p>
            <p className="text-xs text-muted-foreground">Use your webcam</p>
          </button>
        </div>
      )}

      {/* Camera live view */}
      {status === "camera" && (
        <div className="space-y-3">
          <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={stopCamera}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={snapPhoto}>
              <Camera className="mr-2 h-4 w-4" /> Snap
            </Button>
          </div>
        </div>
      )}

      {/* Preview + style + name */}
      {(status === "preview" || status === "uploading" || status === "uploaded" || status === "error") && imageUrl && (
        <div className="space-y-5">
          <div className="flex gap-5 items-start flex-wrap sm:flex-nowrap">
            <div
              className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/15 shadow-md"
              style={{ filter: style.filter }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Avatar preview" className="h-full w-full object-cover" />
            </div>

            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <Label className="mb-2 block text-sm font-semibold">Cartoon style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyleId(s.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        styleId === s.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-accent/40"
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatar-name" className="text-sm font-semibold">
                  Name (optional)
                </Label>
                <Input
                  id="avatar-name"
                  placeholder="e.g. Mama Bear"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={reset} disabled={status === "uploading"}>
              <X className="mr-2 h-4 w-4" /> Start over
            </Button>
            {status === "uploaded" ? (
              <Button disabled>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Saved!
              </Button>
            ) : status === "uploading" ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </Button>
            ) : (
              <Button onClick={upload}>
                <ImageIcon className="mr-2 h-4 w-4" /> Save Avatar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
