import path from "node:path";
import { promises as fs } from "node:fs";
import { runProc } from "./binaries";

export interface GenerateOptions {
  script: string;
  outputDir: string;
  voice?: string; // e.g. "en-US-AriaNeural"
  aspectRatio?: "9:16" | "16:9" | "1:1";
  subtitleStyle?: "burn" | "soft" | "none";
  workDir?: string;
}

export interface GenerateResult {
  outputPath: string;
  durationSec?: number;
}

// Thin wrapper around harry0703/MoneyPrinterTurbo CLI.
// Expects the repo cloned at $MONEYPRINTER_PATH with its venv activated.
// If the binary is not available, throws a clear error caught by the route.
export async function generateProductVideo(
  opts: GenerateOptions
): Promise<GenerateResult> {
  const mpRoot = process.env.MONEYPRINTER_PATH;
  if (!mpRoot) {
    throw new Error(
      "MONEYPRINTER_PATH not set. Clone https://github.com/harry0703/MoneyPrinterTurbo, set up its venv, and export MONEYPRINTER_PATH=/path/to/MoneyPrinterTurbo"
    );
  }

  const workDir = opts.workDir ?? path.join(opts.outputDir, "mp");
  await fs.mkdir(workDir, { recursive: true });

  const taskFile = path.join(workDir, "task.json");
  const task = {
    video_subject: "", // optional — we supply script directly
    video_script: opts.script,
    video_terms: "",
    video_aspect: opts.aspectRatio ?? "9:16",
    voice_name: opts.voice ?? "en-US-JennyNeural-Female",
    subtitle_enabled: opts.subtitleStyle !== "none",
    output_dir: opts.outputDir,
  };
  await fs.writeFile(taskFile, JSON.stringify(task, null, 2));

  // MPT exposes a CLI runner via `python -m app.controllers.task` in some forks
  // and `python webui.py --mode=cli --task <file>` in others. We try the
  // canonical `app/cli.py` if present, otherwise fall back to importing the
  // task module directly.
  const pyEntries = [
    "app/cli.py",
    "main.py",
    "app/controllers/task.py",
    "webui.py",
  ];
  let entry: string | null = null;
  for (const e of pyEntries) {
    const full = path.join(mpRoot, e);
    try {
      await fs.access(full);
      entry = e;
      break;
    } catch {
      // continue
    }
  }
  if (!entry) {
    throw new Error(`No CLI entrypoint found in ${mpRoot}. Ensure MoneyPrinterTurbo is checked out.`);
  }

  const venvPython =
    process.env.MONEYPRINTER_PYTHON ||
    path.join(mpRoot, ".venv", "bin", "python");
  const pythonBin = (await exists(venvPython)) ? venvPython : "python3";

  const { code, stderr } = await runProc(
    pythonBin,
    [entry, "--task-file", taskFile],
    { cwd: mpRoot, timeoutMs: 1_800_000 }
  );
  if (code !== 0) {
    throw new Error(`MoneyPrinterTurbo failed (${code}): ${stderr.slice(-400)}`);
  }

  // Find the latest mp4 in outputDir
  const files = (await fs.readdir(opts.outputDir))
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => path.join(opts.outputDir, f));
  if (files.length === 0) throw new Error("MoneyPrinterTurbo produced no output");
  const stats = await Promise.all(files.map((f) => fs.stat(f).then((s) => ({ f, m: s.mtimeMs }))));
  stats.sort((a, b) => b.m - a.m);
  return { outputPath: stats[0].f };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
