#!/usr/bin/env node
// E2E video test: import + shortsify on a tiny public domain clip.
// Uses Big Buck Bunny short on YouTube (Creative Commons, ~10s) to avoid copyright/scraping issues.

import "dotenv/config";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
// Short Creative-Commons sample. Override with TEST_VIDEO_URL for other targets.
const TEST_URL = process.env.TEST_VIDEO_URL || "https://www.youtube.com/watch?v=YE7VzlLtp-4";

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const e = new Error(`${res.status} ${path}: ${typeof body === "string" ? body : JSON.stringify(body).slice(0,400)}`);
    e.status = res.status; e.body = body; throw e;
  }
  return body;
}

async function waitFor(projectId, jobId, max = 600000) {
  const t0 = Date.now();
  let last = "";
  while (Date.now() - t0 < max) {
    const j = await api(`/api/projects/${projectId}/video/jobs?jobId=${jobId}`);
    const line = `[${Math.round((Date.now() - t0) / 1000)}s] ${j.status} ${Math.round(j.progress || 0)}% ${j.currentStep || ""}`;
    if (line !== last) { console.log(line); last = line; }
    if (j.status === "complete" || j.status === "error") return j;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("timeout");
}

async function main() {
  console.log("=== Video E2E test ===");
  const health = await api("/api/health/video");
  console.log("binaries:", JSON.stringify(health, null, 2));
  if (!health.ready) {
    console.error("Required binaries missing. Skipping E2E.");
    process.exit(2);
  }

  // Reuse an existing project so we don't litter the DB.
  const projects = await api("/api/projects");
  let projectId = projects[0]?.id;
  if (!projectId) {
    const created = await api("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "VideoTest",
        brandUrl: "https://example.com/",
        competitors: [{ name: "AnotherBrand", url: "https://example.org/" }],
      }),
    });
    projectId = created.id;
  }
  console.log("project:", projectId);

  // Test 1: import a TikTok/YouTube reference
  console.log("\n--- Import ---");
  const imp = await api(`/api/projects/${projectId}/video/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: TEST_URL }),
  });
  const impDone = await waitFor(projectId, imp.jobId);
  console.log("import result:", JSON.stringify(impDone.output, null, 2));
  if (impDone.status !== "complete") {
    console.error("Import failed:", impDone.error);
    process.exit(3);
  }
  const refId = impDone.output?.videoReferenceId;
  if (!refId) throw new Error("no videoReferenceId returned");

  // Test 2: shortsify (only if transcript exists — depends on whisper key)
  if (impDone.output?.transcriptLength > 0) {
    console.log("\n--- Shortsify ---");
    const sh = await api(`/api/projects/${projectId}/video/shortsify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoReferenceId: refId, targetDurationSec: 15 }),
    });
    const shDone = await waitFor(projectId, sh.jobId);
    console.log("shortsify result:", JSON.stringify(shDone.output, null, 2));
    if (shDone.status !== "complete") {
      console.error("Shortsify failed:", shDone.error);
      process.exit(4);
    }
    // Verify file is downloadable
    const fileRes = await fetch(`${BASE}/api/projects/${projectId}/video/jobs/${sh.jobId}/file`, { method: "HEAD" });
    console.log("file status:", fileRes.status, "size:", fileRes.headers.get("content-length"));
    if (fileRes.status !== 200) throw new Error("output file not served");
  } else {
    console.log("\nSkipping shortsify (no transcript — set GROQ_API_KEY for cheap whisper)");
  }

  console.log("\n✅ PASS");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
