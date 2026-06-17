"use client";

import { useEffect, useState } from "react";

export function NetworkIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1 text-xs font-medium safe-top">
      You&apos;re offline — some features may not work
    </div>
  );
}
