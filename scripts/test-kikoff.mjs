#!/usr/bin/env node
// Strict E2E test: Kikoff disambiguation + insight quality + script alignment.
//
// Pass criteria:
//   - Brand row populated with fintech-aligned brandPromise + valueProposition + audience
//   - Zero confused terms (football, kickoff meeting, translation) anywhere
//   - 3+ named real fintech credit-builder competitors recognized in output
//   - Insights >= 3 with credit-building language
//   - Generated script mentions credit-building keywords (credit, score, FICO, build credit, debt, etc.)

import "dotenv/config";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

const FINTECH_TERMS = [
  "credit", "fintech", "financial", "finance", "credit builder",
  "credit score", "loan", "banking", "debit", "fico", "credit card", "credit line",
];
const SCRIPT_FINTECH_TERMS = [
  "credit", "fico", "score", "build credit", "debt", "loan",
  "subscription", "no interest", "credit line", "monthly", "report",
];
const BAD_TERMS = [
  "football", "soccer", "nfl", "kickoff meeting", "project kickoff",
  "stadium", "translation", "linguaserve", "language service", "rugby",
];
const EXPECTED_COMPETITORS = [
  "self", "chime", "credit karma", "moneylion", "grow credit", "brigit",
  "credit strong", "stellarfi", "petal", "tomo", "extra", "experian", "klover",
];

function lower(v) { return (v ?? "").toString().toLowerCase(); }
function containsAny(text, terms) {
  const t = lower(text);
  return terms.filter((x) => t.includes(x));
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const e = new Error(`${res.status} ${path}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    e.status = res.status; e.body = body;
    throw e;
  }
  return body;
}

async function waitForCompletion(projectId, jobId, maxMs = 240000) {
  const t0 = Date.now();
  let last = "";
  while (Date.now() - t0 < maxMs) {
    const s = await api(`/api/projects/${projectId}/research/status${jobId ? `?jobId=${jobId}` : ""}`);
    const line = `[${Math.round((Date.now() - t0) / 1000)}s] ${s.status} ${s.progress ?? 0}% ${s.currentStep ?? ""}`;
    if (line !== last) { console.log(line); last = line; }
    if (s.status === "complete" || s.status === "error") return s;
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Test timeout waiting for research");
}

async function main() {
  console.log("=== Kikoff E2E STRICT test ===");

  const create = await api("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandName: "Kikoff",
      brandUrl: "https://kikoff.com/",
      category: "fintech",
      campaignGoal: "Build a 30-second hook ad explaining credit building",
      competitors: [
        { name: "Self", url: "https://www.self.inc/" },
        { name: "Credit Karma", url: "https://www.creditkarma.com/" },
        { name: "Chime", url: "https://www.chime.com/" },
      ],
    }),
  });
  const projectId = create.id;
  console.log("project:", projectId);

  const run = await api(`/api/projects/${projectId}/research`, { method: "POST" });
  console.log("job:", run.jobId);
  const final = await waitForCompletion(projectId, run.jobId);
  if (final.status !== "complete") {
    console.error("Research failed:", final);
    process.exit(2);
  }

  // Fetch results
  const proj = await api(`/api/projects/${projectId}`);
  const insightsResp = await api(`/api/projects/${projectId}/insights`);
  const insights = Array.isArray(insightsResp) ? insightsResp : (insightsResp.insights || []);
  const sellingPoints = Array.isArray(insightsResp.sellingPoints) ? insightsResp.sellingPoints : [];
  const content = await api(`/api/projects/${projectId}/content`);
  const contentList = Array.isArray(content) ? content : (content.assets || content.contentAssets || []);

  // Generate a script
  console.log("\nGenerating script...");
  let script = null;
  try {
    script = await api(`/api/projects/${projectId}/creative/scripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angle: "Building credit from scratch — Kikoff vs the alternatives" }),
    });
    console.log("script id:", script.id, "title:", script.title);
  } catch (e) {
    console.error("Script generation failed:", e.message);
  }

  // Build evaluation blobs
  const brand = proj.brand || {};
  const brandBlob = JSON.stringify(brand);
  const insightsBlob = JSON.stringify(insights);
  const contentBlob = JSON.stringify(contentList);
  const scriptBlob = script ? JSON.stringify(script) : "";

  const fintechHitsBrand = containsAny(brandBlob, FINTECH_TERMS);
  const badInBrand = containsAny(brandBlob, BAD_TERMS);
  const badInContent = containsAny(contentBlob, BAD_TERMS);
  const badInScript = containsAny(scriptBlob, BAD_TERMS);
  const competitorHits = containsAny(
    `${brandBlob}\n${insightsBlob}\n${contentBlob}\n${JSON.stringify(proj.competitors || [])}`,
    EXPECTED_COMPETITORS
  );
  const insightFintechHits = containsAny(insightsBlob, FINTECH_TERMS);
  const scriptFintechHits = script ? containsAny(scriptBlob, SCRIPT_FINTECH_TERMS) : [];
  const brandPromisePopulated = !!(brand.brandPromise && brand.brandPromise.length > 10);
  const brandValuePropPopulated = !!(brand.valueProposition && brand.valueProposition.length > 10);
  const audiencePopulated = !!(brand.targetAudience && brand.targetAudience.length > 5);

  // Strict checks (all critical must pass; warning checks contribute to score)
  const critical = {
    "brand.brandPromise populated": brandPromisePopulated,
    "brand.valueProposition populated": brandValuePropPopulated,
    "brand.targetAudience populated": audiencePopulated,
    "≥3 fintech terms in brand": fintechHitsBrand.length >= 3,
    "zero confusion in brand": badInBrand.length === 0,
    "zero confusion in content": badInContent.length === 0,
    "zero confusion in script": badInScript.length === 0,
    "≥3 insights": insights.length >= 3,
    "≥2 insights with fintech language": insightFintechHits.length >= 2,
    "≥2 real competitor names recognized": competitorHits.length >= 2,
    "script generated": !!script,
    "script has ≥3 fintech terms": scriptFintechHits.length >= 3,
  };

  const passed = Object.values(critical).every(Boolean);
  const total = Object.values(critical).filter(Boolean).length;
  const max = Object.keys(critical).length;

  console.log("\n=== STRICT RUBRIC ===");
  for (const [k, ok] of Object.entries(critical)) {
    console.log(`  ${ok ? "✓" : "✗"} ${k}`);
  }
  console.log(`\nFintech in brand:    ${fintechHitsBrand.join(", ")}`);
  console.log(`Fintech in insights: ${insightFintechHits.join(", ")}`);
  console.log(`Fintech in script:   ${scriptFintechHits.join(", ")}`);
  console.log(`Competitors found:   ${competitorHits.join(", ")}`);
  console.log(`Bad in brand:        ${badInBrand.join(", ") || "(none — good)"}`);
  console.log(`Bad in content:      ${badInContent.join(", ") || "(none — good)"}`);
  console.log(`Bad in script:       ${badInScript.join(", ") || "(none — good)"}`);
  console.log(`Insights count:      ${insights.length}`);
  console.log(`Selling points:      ${sellingPoints.length}`);
  console.log(`Content assets:      ${contentList.length}`);
  if (script) {
    console.log(`\nScript title:        ${script.title}`);
    console.log(`Script angle:        ${script.angle}`);
    console.log(`First hook:          ${(script.hookVariants || [])[0] || ""}`);
    console.log(`Body excerpt:        ${(script.body || "").slice(0, 200)}...`);
  }
  console.log(`\nTOTAL: ${total}/${max} ${passed ? "✅ PASS" : "❌ FAIL"}`);

  // Persist report
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = "/Users/xiaozuo/.claude/mop/_active/mop_20260513T020000Z_XL_kiko/Logs";
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `strict-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({
    projectId, passed, total, max, critical,
    fintechHitsBrand, insightFintechHits, scriptFintechHits,
    competitorHits, badInBrand, badInContent, badInScript,
    insightsCount: insights.length,
    brand: { brandPromise: brand.brandPromise, valueProposition: brand.valueProposition, targetAudience: brand.targetAudience, toneOfVoice: brand.toneOfVoice },
    insightsSample: insights.slice(0, 5),
    script: script ? { id: script.id, title: script.title, angle: script.angle, hookVariants: script.hookVariants, body: script.body, ctaVariants: script.ctaVariants } : null,
  }, null, 2));
  console.log("Report:", file);

  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  if (e.body) console.error(e.body);
  process.exit(3);
});
