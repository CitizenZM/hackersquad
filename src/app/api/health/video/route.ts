import { NextResponse } from "next/server";
import { checkBinaries } from "@/services/video/binaries";

export async function GET() {
  const bins = await checkBinaries();
  const ready = bins.ytdlp.available && bins.ffmpeg.available;
  return NextResponse.json({
    ready,
    binaries: bins,
    transcribe: {
      groq: !!process.env.GROQ_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
    moneyprinter: { configured: !!process.env.MONEYPRINTER_PATH },
  });
}
