"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2, ImageIcon, CheckCircle2, XCircle, RefreshCw,
  MessageSquare, ChevronDown, Camera, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Transition effects catalogue ────────────────────────────────────────────

export const TRANSITIONS = [
  // Cuts
  { id: "cut",          label: "Cut",              category: "Cut",       icon: "✂️", description: "Instant cut to next frame" },
  { id: "cut-on-motion",label: "Cut on Motion",    category: "Cut",       icon: "⚡", description: "Cut aligned to a movement peak" },
  { id: "smash-cut",    label: "Smash Cut",        category: "Cut",       icon: "💥", description: "Jarring abrupt cut for impact" },
  // Dissolves
  { id: "cross-dissolve",label: "Cross Dissolve",  category: "Dissolve",  icon: "🔀", description: "Gradual blend between frames" },
  { id: "dip-to-black", label: "Dip to Black",     category: "Dissolve",  icon: "⬛", description: "Fade out to black, fade in" },
  { id: "dip-to-white", label: "Dip to White",     category: "Dissolve",  icon: "⬜", description: "Flash to white — energy surge" },
  { id: "match-dissolve",label: "Match Dissolve",  category: "Dissolve",  icon: "🎯", description: "Dissolve matching shapes/colors" },
  // Wipes
  { id: "wipe-left",    label: "Wipe Left",        category: "Wipe",      icon: "⬅️", description: "Frame slides in from right" },
  { id: "wipe-right",   label: "Wipe Right",       category: "Wipe",      icon: "➡️", description: "Frame slides in from left" },
  { id: "iris-open",    label: "Iris Open",        category: "Wipe",      icon: "🔵", description: "Circular reveal from center" },
  // Camera
  { id: "whip-pan",     label: "Whip Pan",         category: "Camera",    icon: "💨", description: "Fast horizontal sweep blur" },
  { id: "rack-focus",   label: "Rack Focus",       category: "Camera",    icon: "🔍", description: "Shift focus plane to next subject" },
  { id: "dolly-zoom",   label: "Dolly Zoom",       category: "Camera",    icon: "🌀", description: "Vertigo / Hitchcock zoom effect" },
  // Speed
  { id: "speed-ramp",   label: "Speed Ramp",       category: "Speed",     icon: "⏩", description: "Slow-mo into normal/fast" },
  { id: "freeze-frame", label: "Freeze Frame",     category: "Speed",     icon: "⏸️", description: "Pause then cut to next" },
  // Match
  { id: "match-cut",    label: "Match Cut",        category: "Match",     icon: "🔗", description: "Visual rhyme between two frames" },
  { id: "j-cut",        label: "J-Cut",            category: "Match",     icon: "🎵", description: "Audio from next frame starts early" },
  { id: "l-cut",        label: "L-Cut",            category: "Match",     icon: "🎶", description: "Audio from prev frame continues" },
] as const;

export type TransitionId = typeof TRANSITIONS[number]["id"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoryboardFrameData {
  frameNumber: number;
  duration: string;
  scene: string;
  visualDirection: string;
  voiceover: string;
  textOverlay: string;
  cameraNotes: string;
  imagePrompt: string;
  // Enriched fields (saved back to DB)
  imageUrl?: string | null;
  transitionEffect?: TransitionId | null;
  approved?: boolean | null;
  feedback?: string | null;
}

interface StoryboardFrameCardProps {
  frame: StoryboardFrameData;
  storyboardId: string;
  projectId: string;
  autoLoad?: boolean; // if true, generates image on mount
  isLast?: boolean;
  onUpdate?: (frameNumber: number, updates: Partial<StoryboardFrameData>) => void;
}

// ─── Transition picker ────────────────────────────────────────────────────────

function TransitionPicker({
  value,
  onChange,
}: {
  value: TransitionId | null | undefined;
  onChange: (id: TransitionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TRANSITIONS.find(t => t.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [...new Set(TRANSITIONS.map(t => t.category))];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors w-full",
          value
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-border text-muted-foreground hover:border-foreground/30"
        )}
      >
        <Zap className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{selected ? `${selected.icon} ${selected.label}` : "Add transition →"}</span>
        <ChevronDown className="h-3 w-3 ml-auto flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Transition to next frame</p>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 space-y-1">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">{cat}</p>
                {TRANSITIONS.filter(t => t.category === cat).map(t => (
                  <button
                    key={t.id}
                    onClick={() => { onChange(t.id as TransitionId); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                      value === t.id
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>
                    </div>
                    {value === t.id && <CheckCircle2 className="h-3 w-3 text-blue-500 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main card component ──────────────────────────────────────────────────────

export function StoryboardFrameCard({
  frame,
  storyboardId,
  projectId,
  autoLoad = false,
  isLast = false,
  onUpdate,
}: StoryboardFrameCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(frame.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [transition, setTransition] = useState<TransitionId | null | undefined>(
    frame.transitionEffect as TransitionId | null | undefined
  );
  const [approved, setApproved] = useState<boolean | null>(frame.approved ?? null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(frame.feedback || "");
  const [saving, setSaving] = useState(false);
  const autoLoadedRef = useRef(false);

  // Auto-load on mount if requested and no image yet
  useEffect(() => {
    if (autoLoad && !imageUrl && !loading && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      generateImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  async function generateImage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/studio/frames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: frame.imagePrompt,
          style: "cinematic storyboard concept art",
          dimensions: "512x288",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        await saveFrameUpdate({ imageUrl: data.imageUrl });
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  async function saveFrameUpdate(updates: Partial<StoryboardFrameData>) {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/creative/storyboards/${storyboardId}/frames`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameNumber: frame.frameNumber, ...updates }),
      });
      onUpdate?.(frame.frameNumber, updates);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleTransitionChange(id: TransitionId) {
    setTransition(id);
    await saveFrameUpdate({ transitionEffect: id });
  }

  async function handleApproval(value: boolean) {
    setApproved(value);
    await saveFrameUpdate({ approved: value });
    if (!value) setShowFeedback(true);
  }

  async function handleFeedbackSave() {
    await saveFrameUpdate({ feedback, approved: false });
    setShowFeedback(false);
  }

  const selectedTransition = TRANSITIONS.find(t => t.id === transition);

  return (
    <div className="flex flex-col">
      {/* ── Frame card ── */}
      <div className={cn(
        "rounded-xl border-2 overflow-hidden transition-all",
        approved === true && "border-emerald-400 shadow-emerald-100 shadow-md",
        approved === false && "border-red-300 shadow-red-50 shadow-md",
        approved === null && "border-border"
      )}>
        {/* Image area */}
        <div className="aspect-video relative overflow-hidden bg-muted/60">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={frame.scene}
                className="w-full h-full object-cover"
                onError={() => setImageUrl(null)}
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button
                  onClick={generateImage}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 text-[10px] font-semibold text-foreground hover:bg-white transition-colors"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Regenerate
                </button>
              </div>
            </>
          ) : loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Generating frame {frame.frameNumber}…</p>
              <p className="text-[9px] text-muted-foreground/60 max-w-[160px] text-center">{frame.scene.slice(0, 60)}</p>
            </div>
          ) : (
            <button
              onClick={generateImage}
              className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-[10px] text-muted-foreground font-medium">Click to generate</p>
              <p className="text-[9px] text-muted-foreground/60 max-w-[140px] text-center">{frame.scene.slice(0, 50)}</p>
            </button>
          )}

          {/* Frame # badge */}
          <div className="absolute top-2 left-2 bg-foreground/80 text-background text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            #{frame.frameNumber}
          </div>
          {/* Duration badge */}
          <div className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {frame.duration}
          </div>
          {/* Approval badge */}
          {approved !== null && (
            <div className={cn(
              "absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full",
              approved ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}>
              {approved ? "✓ Approved" : "✗ Needs work"}
            </div>
          )}
          {saving && (
            <div className="absolute bottom-2 right-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Frame details */}
        <div className="p-3 space-y-2 bg-card">
          {/* Scene description */}
          <p className="text-[11px] font-semibold leading-snug">{frame.scene}</p>

          {/* Camera notes */}
          {frame.cameraNotes && (
            <div className="flex items-start gap-1.5">
              <Camera className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground italic leading-snug">{frame.cameraNotes}</p>
            </div>
          )}

          {/* Visual direction */}
          {frame.visualDirection && (
            <p className="text-[10px] text-foreground/70 leading-snug border-l-2 border-blue-300 pl-2">
              {frame.visualDirection}
            </p>
          )}

          {/* Voiceover */}
          {frame.voiceover && (
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">VO</p>
              <p className="text-[10px] italic text-foreground/80">&ldquo;{frame.voiceover}&rdquo;</p>
            </div>
          )}

          {/* Text overlay */}
          {frame.textOverlay && (
            <div className="rounded bg-foreground/5 border border-border px-2 py-1">
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">On Screen</p>
              <p className="text-[10px] font-bold">{frame.textOverlay}</p>
            </div>
          )}

          {/* Approval controls */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border">
            <button
              onClick={() => handleApproval(true)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors",
                approved === true
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "border border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600"
              )}
            >
              <CheckCircle2 className="h-3 w-3" /> Approve
            </button>
            <button
              onClick={() => handleApproval(false)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors",
                approved === false
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "border border-border text-muted-foreground hover:border-red-300 hover:text-red-600"
              )}
            >
              <XCircle className="h-3 w-3" /> Revise
            </button>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <MessageSquare className="h-3 w-3" />
              {feedback ? "Edit note" : "Add note"}
            </button>
          </div>

          {/* Feedback input */}
          {showFeedback && (
            <div className="space-y-1.5">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Describe what to change — e.g. 'Make it brighter', 'Show the product earlier', 'Change to outdoor setting'…"
                rows={2}
                className="w-full text-[11px] rounded-lg border border-border bg-muted/30 px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleFeedbackSave}
                  className="px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-semibold hover:bg-foreground/90"
                >
                  Save note
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-2 py-1 rounded-lg border border-border text-[10px] text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Saved feedback display */}
          {feedback && !showFeedback && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
              <p className="text-[9px] font-semibold text-amber-700 mb-0.5">Note</p>
              <p className="text-[10px] text-amber-800">{feedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Transition arrow to next frame ── */}
      {!isLast && (
        <div className="flex flex-col items-center py-2 gap-1">
          <div className="w-px h-3 bg-border" />
          <TransitionPicker value={transition} onChange={handleTransitionChange} />
          {selectedTransition && (
            <p className="text-[9px] text-muted-foreground text-center">{selectedTransition.description}</p>
          )}
          <div className="w-px h-3 bg-border" />
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
