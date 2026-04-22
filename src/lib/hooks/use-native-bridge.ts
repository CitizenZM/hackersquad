"use client";

import { useEffect, useState, useCallback } from "react";

interface NativeBridge {
  isNative: boolean;
  platform: "ios" | "android" | "web";
  hapticImpact: (style?: "light" | "medium" | "heavy") => Promise<void>;
  hapticNotification: (type?: "success" | "warning" | "error") => Promise<void>;
  setStatusBarStyle: (style: "dark" | "light") => Promise<void>;
  hideSplash: () => Promise<void>;
  registerPush: () => Promise<string | null>;
}

function isCapacitorAvailable(): boolean {
  return typeof window !== "undefined" && !!((window as unknown as Record<string, unknown>)).Capacitor;
}

export function useNativeBridge(): NativeBridge {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web");

  useEffect(() => {
    if (isCapacitorAvailable()) {
      setIsNative(true);
      const cap = ((window as unknown as Record<string, unknown>)).Capacitor as Record<string, unknown>;
      const p = cap.getPlatform as (() => string) | undefined;
      if (p) {
        const plat = p();
        setPlatform(plat === "ios" ? "ios" : plat === "android" ? "android" : "web");
      }
    }
  }, []);

  const hapticImpact = useCallback(
    async (style: "light" | "medium" | "heavy" = "medium") => {
      if (!isNative) return;
      try {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
        const styleMap = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        await Haptics.impact({ style: styleMap[style] });
      } catch {}
    },
    [isNative]
  );

  const hapticNotification = useCallback(
    async (type: "success" | "warning" | "error" = "success") => {
      if (!isNative) return;
      try {
        const { Haptics, NotificationType } = await import("@capacitor/haptics");
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        };
        await Haptics.notification({ type: typeMap[type] });
      } catch {}
    },
    [isNative]
  );

  const setStatusBarStyle = useCallback(
    async (style: "dark" | "light") => {
      if (!isNative) return;
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({
          style: style === "dark" ? Style.Dark : Style.Light,
        });
      } catch {}
    },
    [isNative]
  );

  const hideSplash = useCallback(async () => {
    if (!isNative) return;
    try {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide();
    } catch {}
  }, [isNative]);

  const registerPush = useCallback(async (): Promise<string | null> => {
    if (!isNative) return null;
    try {
      const { PushNotifications } = await import(
        "@capacitor/push-notifications"
      );
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return null;
      await PushNotifications.register();
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          resolve(token.value);
        });
        PushNotifications.addListener("registrationError", () => {
          resolve(null);
        });
        setTimeout(() => resolve(null), 5000);
      });
    } catch {
      return null;
    }
  }, [isNative]);

  return {
    isNative,
    platform,
    hapticImpact,
    hapticNotification,
    setStatusBarStyle,
    hideSplash,
    registerPush,
  };
}
