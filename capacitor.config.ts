import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.storynest.kids",
  appName: "StoryNest Kids",
  webDir: "out",
  server: {
    url: "https://hackersquad.vercel.app",
    cleartext: false,
  },
  ios: {
    scheme: "StoryNest",
    contentInset: "always",
    backgroundColor: "#FFF8F0",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#FFF8F0",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "DARK",
    },
  },
};

export default config;
