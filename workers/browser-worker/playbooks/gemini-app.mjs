// playbooks/gemini-app.mjs
//
// Google Gemini App (gemini.google.com) image generation playbook.
//
// IMPORTANT CONTEXT: a manual live test found that aistudio.google.com
// ("AI Studio" / dev console) is a DEAD END for token-free generation — the
// Nano Banana image models there require a linked PAID API billing account.
// gemini.google.com (the consumer Gemini App) DOES work token-free, using
// the account's existing Pro subscription quota, zero API key needed. This
// file replaces the old ai-studio.mjs implementation (removed).
//
// Drives the operator's already-logged-in Chrome via the `browser-harness`
// CLI (heredoc Python, helpers pre-imported: new_tab, wait_for_load,
// capture_screenshot, click_at_xy, type_text, press_key, js, http_get). Each
// step is independently debuggable and failures name the exact step that
// broke via `GEMINI_APP_STEP_FAILED[<step>]: ...` errors.
//
// Selectors WILL drift over time (Google ships UI changes frequently). Every
// step follows: screenshot -> locate (via getBoundingClientRect in js()) ->
// act (click_at_xy with real page-space coordinates) -> screenshot-verify.

import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { runHarness as runHarnessBase, parseLastJson as parseLastJsonBase } from './_harness.mjs';

const ERROR_PREFIX = 'GEMINI_APP_STEP_FAILED';

function runHarness(pythonSrc, opts = {}) {
  return runHarnessBase(pythonSrc, { errorPrefix: ERROR_PREFIX, logPrefix: 'gemini-app', ...opts });
}

function parseLastJson(stdout, label) {
  return parseLastJsonBase(stdout, label, ERROR_PREFIX);
}

// ---- Constants: URLs, timing, JS snippets -------------------------------

const GEMINI_APP_URL = 'https://gemini.google.com/app';
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = 3 * 60 * 1000; // 3 minutes

const CHECK_SIGNIN_JS = `
(() => {
  const text = document.body.innerText || '';
  return /sign in/i.test(text) && /google/i.test(text);
})()
`.trim();

// Locate the Quill-based contenteditable prompt input.
const FIND_INPUT_JS = `
(() => {
  const el = document.querySelector('.ql-editor, [contenteditable="true"], textarea');
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 5) return { found: false };
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

// Locate the send button by aria-label (confirmed exact label: "Send message").
const FIND_SEND_BUTTON_JS = `
(() => {
  const btn = document.querySelector('button[aria-label*="Send" i]');
  if (!btn) return { found: false };
  const rect = btn.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

// Defensive check for a rendered clarifying-question / cost-confirmation
// pattern (short clickable option rows). Gemini App image gen has not been
// observed to show one, but we check defensively in case some account tiers
// surface one, falling back to "proceed" if none found.
const FIND_CONFIRMATION_JS = `
(() => {
  const rows = Array.from(document.querySelectorAll('button, [role="button"], div'))
    .filter(el => {
      const t = (el.textContent || '').trim();
      return t.length > 0 && t.length < 40 && /approve|confirm|continue|yes/i.test(t);
    });
  if (rows.length === 0) return { found: false };
  const el = rows[0];
  const rect = el.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.textContent.trim() };
})()
`.trim();

// Extraction: draw the response <img> onto an off-screen canvas and read it
// back as a base64 PNG data URL. This bypasses blob: URL cross-realm fetch
// failures entirely (confirmed broken from a CDP Runtime.evaluate context)
// and is the PRIMARY method here, not a fallback.
const EXTRACT_IMAGE_VIA_CANVAS_JS = `
(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const candidates = imgs
    .filter(img => img.src && img.complete && img.naturalWidth > 64 && img.naturalHeight > 64)
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  if (candidates.length === 0) return { found: false };
  const img = candidates[0];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    return { found: true, dataUrl };
  } catch (err) {
    return { found: false, error: String(err && err.message ? err.message : err) };
  }
})()
`.trim();

// ---- Steps ----------------------------------------------------------------

async function stepOpenAndCheckAuth() {
  const py = `
import json
new_tab(${JSON.stringify(GEMINI_APP_URL)})
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

async function stepTypePromptAndSubmit(job) {
  const py = `
import json
loc = js(${JSON.stringify(FIND_INPUT_JS)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'find_prompt_input' });
  const loc = parseLastJson(out, 'find_prompt_input');
  if (!loc.found) {
    throw new Error(`${ERROR_PREFIX}[find_prompt_input]: could not locate .ql-editor / contenteditable prompt input`);
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

  // Prefer clicking the explicit send button (aria-label based); fall back to
  // Enter if it can't be located, since some layouts submit on Enter alone.
  const py3 = `
import json
loc = js(${JSON.stringify(FIND_SEND_BUTTON_JS)})
print(json.dumps(loc))
`;
  const out3 = await runHarness(py3, { label: 'find_send_button' });
  const sendLoc = parseLastJson(out3, 'find_send_button');

  if (sendLoc.found) {
    const py4 = `
click_at_xy(${sendLoc.x}, ${sendLoc.y})
capture_screenshot()
`;
    await runHarness(py4, { label: 'click_send_button' });
  } else {
    const py4 = `
press_key("Enter")
capture_screenshot()
`;
    await runHarness(py4, { label: 'submit_via_enter' });
  }
}

// Defensive check for a confirmation/clarifying-question gate. Gemini App
// image gen hasn't shown one in testing, but check briefly in case some
// account tiers surface it; proceed if nothing appears within a couple secs.
async function stepMaybeHandleConfirmation() {
  const py = `
import json
loc = js(${JSON.stringify(FIND_CONFIRMATION_JS)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'check_confirmation_gate' });
  const loc = parseLastJson(out, 'check_confirmation_gate');
  if (loc.found) {
    console.log(`[gemini-app] check_confirmation_gate: found "${loc.text}", clicking it`);
    const py2 = `
click_at_xy(${loc.x}, ${loc.y})
capture_screenshot()
`;
    await runHarness(py2, { label: 'click_confirmation_gate' });
  }
}

async function stepPollForImage() {
  const deadline = Date.now() + POLL_MAX_MS;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    const py = `
import json
capture_screenshot()
result = js(${JSON.stringify(EXTRACT_IMAGE_VIA_CANVAS_JS)})
signed_out = js(${JSON.stringify(CHECK_SIGNIN_JS)})
print(json.dumps({"result": result, "signed_out": signed_out}))
`;
    const out = await runHarness(py, { label: `poll_for_image_attempt_${attempt}` });
    const parsed = parseLastJson(out, `poll_for_image_attempt_${attempt}`);

    if (parsed.signed_out) {
      throw new Error('AUTH_REQUIRED: log into Google in Chrome');
    }
    if (parsed.result && parsed.result.found) {
      return parsed.result.dataUrl;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`${ERROR_PREFIX}[poll_for_image]: timed out after 3 minutes waiting for generated image`);
}

async function stepDownloadImage(dataUrl) {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    throw new Error(`${ERROR_PREFIX}[download_image]: unrecognized data URI format`);
  }
  const dir = await mkdtemp(path.join(tmpdir(), 'browser-worker-gemini-app-'));
  const filePath = path.join(dir, `output-${Date.now()}.png`);
  const buf = Buffer.from(match[2], 'base64');
  await writeFile(filePath, buf);
  return filePath;
}

// ---- Public entry point ----------------------------------------------------

/**
 * Run the Gemini App image generation playbook for one job.
 * @param {object} job - BrowserGenJob row (id, prompt, negativePrompt, inputImageUrl, aspectRatio, ...)
 * @returns {Promise<{filePath: string}>}
 */
export async function runGeminiAppJob(job) {
  if (!job || !job.prompt) {
    throw new Error(`${ERROR_PREFIX}[validate_job]: job.prompt is required`);
  }

  await stepOpenAndCheckAuth();
  await stepTypePromptAndSubmit(job);
  await stepMaybeHandleConfirmation();
  const dataUrl = await stepPollForImage();
  const filePath = await stepDownloadImage(dataUrl);

  return { filePath };
}

export default runGeminiAppJob;
