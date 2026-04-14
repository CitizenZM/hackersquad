"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Delete } from "lucide-react";

export function PinEntry() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  async function submit(finalPin: string) {
    try {
      const res = await fetch("/api/parent-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: finalPin }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Wrong PIN");
        setShaking(true);
        setTimeout(() => {
          setPin("");
          setShaking(false);
          setError("");
        }, 800);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
  }

  useEffect(() => {
    if (pin.length === 4) {
      submit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function addDigit(d: string) {
    if (pin.length < 4) {
      setPin((p) => p + d);
    }
  }

  function removeDigit() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-8 safe-top safe-bottom bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Back to mode selector */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-child-primary/10 mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Parent Mode</h1>
        <p className="text-sm text-foreground/50">Enter the 4-digit PIN to continue</p>
      </div>

      {/* PIN dots */}
      <motion.div
        animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-4 mb-4"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all ${
              pin.length > i
                ? error
                  ? "bg-red-500 border-red-500"
                  : "bg-child-primary border-child-primary"
                : "border-foreground/30"
            }`}
          />
        ))}
      </motion.div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}
      {!error && <div className="h-5 mb-4" />}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => addDigit(d)}
            className="h-16 w-16 rounded-full bg-white text-2xl font-semibold shadow-sm active:scale-90 transition-transform"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => addDigit("0")}
          className="h-16 w-16 rounded-full bg-white text-2xl font-semibold shadow-sm active:scale-90 transition-transform"
        >
          0
        </button>
        <button
          onClick={removeDigit}
          className="h-16 w-16 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <Delete className="h-6 w-6 text-foreground/60" />
        </button>
      </div>

      <p className="mt-8 text-xs text-foreground/40">
        Default PIN: <span className="font-mono">1234</span>
      </p>
    </div>
  );
}
