"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface BedtimeContextType {
  isBedtime: boolean;
  toggleBedtime: () => void;
}

const BedtimeContext = createContext<BedtimeContextType>({
  isBedtime: false,
  toggleBedtime: () => {},
});

export function BedtimeProvider({ children }: { children: ReactNode }) {
  const [isBedtime, setIsBedtime] = useState(false);

  const toggleBedtime = useCallback(() => {
    setIsBedtime((b) => !b);
  }, []);

  return (
    <BedtimeContext.Provider value={{ isBedtime, toggleBedtime }}>
      <div className={isBedtime ? "bedtime-mode" : ""}>
        {children}
      </div>
    </BedtimeContext.Provider>
  );
}

export function useBedtimeMode() {
  return useContext(BedtimeContext);
}
