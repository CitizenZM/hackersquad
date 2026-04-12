"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { JobEvent, JobStep } from "@/services/job-manager";

interface SSEState {
  status: string;
  progress: number;
  currentStep: string | null;
  steps: JobStep[];
  error?: string;
  messages: string[];
}

export function useSSE(url: string | null) {
  const [state, setState] = useState<SSEState>({
    status: "pending",
    progress: 0,
    currentStep: null,
    steps: [],
    messages: [],
  });
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const parsed: JobEvent = JSON.parse(event.data);
        setState((prev) => ({
          status: parsed.data.status || prev.status,
          progress: parsed.data.progress ?? prev.progress,
          currentStep: parsed.data.currentStep ?? prev.currentStep,
          steps: parsed.data.steps || prev.steps,
          error: parsed.data.error || prev.error,
          messages: parsed.data.message
            ? [...prev.messages, parsed.data.message]
            : prev.messages,
        }));

        if (parsed.type === "complete" || parsed.type === "error") {
          es.close();
          setConnected(false);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { ...state, connected };
}
