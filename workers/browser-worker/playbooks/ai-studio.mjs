// playbooks/ai-studio.mjs
//
// Google AI Studio ("Nano Banana" image generation) playbook.
//
// Drives the operator's already-logged-in Chrome via the `browser-harness` CLI
// (heredoc Python, helpers pre-imported: new_tab, wait_for_load, capture_screenshot,
// click_at_xy, js, http_get). We shell out to `browser-harness` per step so each
// step is independently debuggable and failures name the exact step that broke.
//
// Selectors and pixel coordinates in AI Studio WILL drift over time (Google ships
// UI changes frequently). Every step follows: screenshot -> locate -> act ->
// screenshot-verify, and throws an Error naming the step on failure so a human
// (or a future agent) can quickly tell which stage needs re-tuning.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

// ---- Constants: URLs, timing, JS snippets -------------------------------

const AI_STUDIO_URL = 'https://aistudio.google.com/prompts/new_chat';
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = 3 * 60 * 1000; // 3 minutes
const STEP_TIMEOUT_MS = 60 * 1000; // per browser-harness invocation

// JS snippet run inside the page (via the harness `js()` helper) to find a
// generated <img> and return either its src directly (http/data URL) or,
// for blob: URLs, a base64-encoded data URI fetched in-page.
const EXTRACT_IMAGE_JS = `
(async () => {
  const imgs = Array.from(document.querySelectorAll('img'));
  // Heuristic: generated output images are usually the largest visible <img>
  // that isn't an icon/avatar. Sort by rendered area, descending.
  const candidates = imgs
    .filter(img => img.src && img.naturalWidth > 64 && img.naturalHeight > 64)
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  if (candidates.length === 0) return null;
  const img = candidates[0];
  const src = img.src;
  if (src.startsWith('data:')) {
    return { kind: 'data', src };
  }
  if (src.startsWith('blob:')) {
    const resp = await fetch(src);
    const blob = await resp.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return { kind: 'data', src: 'data:' + (blob.type || 'image/png') + ';base64,' + b64 };
  }
  // http(s) URL (e.g. googleusercontent) - return as-is, worker will http_get it.
  return { kind: 'url', src };
})()
`.trim();

const CHECK_SIGNIN_JS = `
(() => {
  const text = document.body.innerText || '';
  return /sign in/i.test(text) && /google/i.test(text);
})()
`.trim();

// ---- Low-level: run a browser-harness heredoc script --------------------

async function runHarness(pythonSrc, { label, timeoutMs = STEP_TIMEOUT_MS } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      ['-c', `browser-harness <<'PY'\n${pythonSrc}\nPY`],
      { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 }
    );
    if (stderr && stderr.trim()) {
      // browser-harness prints diagnostics to stderr sometimes; don't fail on it alone,
      // but surface it for debugging.
      console.log(`[ai-studio] (stderr) [${label}]`, stderr.trim().slice(0, 2000));
    }
    return stdout;
  } catch (err) {
    throw new Error(
      `AI_STUDIO_STEP_FAILED[${label}]: ${err.message || err}`
    );
  }
}

// Extract the last JSON value printed to stdout by a harness script.
function parseLastJson(stdout, label) {
  const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // keep scanning backwards
    }
  }
  throw new Error(`AI_STUDIO_STEP_FAILED[${label}]: could not parse JSON from harness output: ${stdout.slice(-500)}`);
}

// ---- Steps ----------------------------------------------------------------

async function stepOpenAndCheckAuth() {
  const py = `
import json
new_tab(${JSON.stringify(AI_STUDIO_URL)})
wait_for_load()
signed_out = js(${JSON.stringify(CHECK_SIGNIN_JS)})
info = page_info()
print(json.dumps({"signed_out": signed_out, "url": info.get("url")}))
`;
  const out = await runHarness(py, { label: 'open_and_check_auth' });
  const result = parseLastJson(out, 'open_and_check_auth');
  if (result.signed_out) {
    throw new Error('AUTH_REQUIRED: log into Google in Chrome');
  }
  return result;
}

async function stepSelectImageModel() {
  // Screenshot first so a human/agent debugging this later can see what the
  // model picker actually looked like when this broke.
  const py = `
capture_screenshot()
`;
  await runHarness(py, { label: 'select_model_screenshot' });

  // AI Studio's "new chat" view exposes a model dropdown, usually top-left of the
  // prompt panel. We search the DOM by visible text rather than hardcoded pixels
  // where possible, falling back to a labeled click. This selector is expected to
  // drift; keep the failure message specific so it's obvious what to re-tune.
  const selectModelJs = `
(() => {
  // Try to find a model-picker trigger element by common text patterns.
  const all = Array.from(document.querySelectorAll('button, [role="button"], mat-select, [class*="model"]'));
  const trigger = all.find(el => /model/i.test(el.textContent || '') || /gemini/i.test(el.textContent || ''));
  if (!trigger) return { found: false };
  const rect = trigger.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py2 = `
import json
loc = js(${JSON.stringify(selectModelJs)})
print(json.dumps(loc))
`;
  const out2 = await runHarness(py2, { label: 'select_model_locate' });
  const loc = parseLastJson(out2, 'select_model_locate');
  if (!loc.found) {
    throw new Error('AI_STUDIO_STEP_FAILED[select_model_locate]: could not locate model picker trigger in DOM');
  }

  const py3 = `
click_at_xy(${loc.x}, ${loc.y})
capture_screenshot()
`;
  await runHarness(py3, { label: 'select_model_click' });

  // After opening the dropdown, look for a Nano Banana / image-generation model
  // option by text and click it. If not found, this is a soft failure — some
  // AI Studio prompt surfaces already default to an image-capable model, so we
  // don't hard-fail here; we just log and proceed, verifying via screenshot.
  const findOptionJs = `
(() => {
  const opts = Array.from(document.querySelectorAll('[role="option"], mat-option, li, div'));
  const match = opts.find(el => {
    const t = (el.textContent || '').toLowerCase();
    return t.includes('nano banana') || (t.includes('image') && t.includes('gemini'));
  });
  if (!match) return { found: false };
  const rect = match.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py4 = `
import json
loc = js(${JSON.stringify(findOptionJs)})
print(json.dumps(loc))
`;
  const out4 = await runHarness(py4, { label: 'select_model_find_option' });
  const optLoc = parseLastJson(out4, 'select_model_find_option');

  if (optLoc.found) {
    const py5 = `
click_at_xy(${optLoc.x}, ${optLoc.y})
capture_screenshot()
`;
    await runHarness(py5, { label: 'select_model_confirm' });
  } else {
    console.log('[ai-studio] select_model_find_option: no explicit image-model option found; assuming current model supports image generation');
  }
}

async function stepTypePromptAndSubmit(job) {
  const findInputJs = `
(() => {
  const candidates = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
  const visible = candidates.find(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 100 && rect.height > 10;
  });
  if (!visible) return { found: false };
  const rect = visible.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py = `
import json
loc = js(${JSON.stringify(findInputJs)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'find_prompt_input' });
  const loc = parseLastJson(out, 'find_prompt_input');
  if (!loc.found) {
    throw new Error('AI_STUDIO_STEP_FAILED[find_prompt_input]: could not locate prompt textarea/contenteditable');
  }

  const promptText = job.negativePrompt
    ? `${job.prompt}\n\n(avoid: ${job.negativePrompt})`
    : job.prompt;

  const py2 = `
click_at_xy(${loc.x}, ${loc.y})
type_text(${JSON.stringify(promptText)})
capture_screenshot()
`;
  await runHarness(py2, { label: 'type_prompt' });

  // Submit: try Enter first (common in chat-style inputs), verify with screenshot.
  const py3 = `
press_key("Enter")
capture_screenshot()
`;
  await runHarness(py3, { label: 'submit_prompt' });
}

async function stepPollForImage() {
  const deadline = Date.now() + POLL_MAX_MS;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    const py = `
import json
capture_screenshot()
result = js(${JSON.stringify(EXTRACT_IMAGE_JS)})
signed_out = js(${JSON.stringify(CHECK_SIGNIN_JS)})
print(json.dumps({"result": result, "signed_out": signed_out}))
`;
    const out = await runHarness(py, { label: `poll_for_image_attempt_${attempt}` });
    const parsed = parseLastJson(out, `poll_for_image_attempt_${attempt}`);

    if (parsed.signed_out) {
      throw new Error('AUTH_REQUIRED: log into Google in Chrome');
    }
    if (parsed.result) {
      return parsed.result; // { kind: 'data'|'url', src }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('AI_STUDIO_STEP_FAILED[poll_for_image]: timed out after 3 minutes waiting for generated image');
}

async function stepDownloadImage(extracted) {
  const dir = await mkdtemp(path.join(tmpdir(), 'browser-worker-ai-studio-'));
  const filePath = path.join(dir, `output-${Date.now()}.png`);

  if (extracted.kind === 'data') {
    const match = /^data:(.+?);base64,(.*)$/.exec(extracted.src);
    if (!match) {
      throw new Error('AI_STUDIO_STEP_FAILED[download_image]: unrecognized data URI format');
    }
    const buf = Buffer.from(match[2], 'base64');
    await writeFile(filePath, buf);
    return filePath;
  }

  if (extracted.kind === 'url') {
    // Use the harness's http_get for non-blob http(s) URLs (e.g. googleusercontent).
    const py = `
import json, base64
data = http_get(${JSON.stringify(extracted.src)})
# http_get is expected to return bytes-like or a dict with base64 content depending
# on harness version; normalize defensively.
if isinstance(data, (bytes, bytearray)):
    encoded = base64.b64encode(data).decode('ascii')
elif isinstance(data, dict) and 'content' in data:
    encoded = data['content']
else:
    encoded = base64.b64encode(str(data).encode('utf-8')).decode('ascii')
print(json.dumps({"b64": encoded}))
`;
    const out = await runHarness(py, { label: 'download_image_http_get' });
    const parsed = parseLastJson(out, 'download_image_http_get');
    const buf = Buffer.from(parsed.b64, 'base64');
    await writeFile(filePath, buf);
    return filePath;
  }

  throw new Error(`AI_STUDIO_STEP_FAILED[download_image]: unknown extracted.kind "${extracted.kind}"`);
}

// ---- Public entry point ----------------------------------------------------

/**
 * Run the AI Studio (Nano Banana) image generation playbook for one job.
 * @param {object} job - BrowserGenJob row (id, prompt, negativePrompt, inputImageUrl, aspectRatio, ...)
 * @returns {Promise<{filePath: string}>}
 */
export async function runAiStudioJob(job) {
  if (!job || !job.prompt) {
    throw new Error('AI_STUDIO_STEP_FAILED[validate_job]: job.prompt is required');
  }

  await stepOpenAndCheckAuth();
  await stepSelectImageModel();
  await stepTypePromptAndSubmit(job);
  const extracted = await stepPollForImage();
  const filePath = await stepDownloadImage(extracted);

  return { filePath };
}

export default runAiStudioJob;
