// playbooks/flow.mjs
//
// Google Flow (labs.google/fx/tools/flow) video generation playbook.
//
// Confirmed by a manual live test to work token-free — generated a real
// 6-second video using the account's existing quota, zero API key needed.
// Drives the operator's already-logged-in Chrome via the `browser-harness`
// CLI. Each step is independently debuggable and failures name the exact
// step that broke via `FLOW_STEP_FAILED[<step>]: ...` errors.
//
// Key discovered facts (see task brief for full detail):
//   - First-time users see a one-time consent modal (two unchecked
//     checkboxes + "Next"), then a two-page privacy policy modal whose
//     "Continue" button only enables after scrolling the policy text to the
//     bottom. Returning users likely skip this — we check for it and only
//     handle it if present.
//   - Inside a project: a right-side agent chat panel with a text input
//     (placeholder "What do you want to create?") and a send button.
//   - The agent may ask a CLARIFYING QUESTION with plain-div option rows
//     (e.g. video duration) — auto-pick the closest numeric match, else the
//     first/safest option.
//   - The agent ALWAYS asks a cost-confirmation gate before generating
//     ("Approve" / "Approve, do not ask again" / "Reject") — we always click
//     plain "Approve", never the do-not-ask-again variant.
//   - GOTCHA: Flow pages contain decorative promo/banner <video> elements
//     (gstatic.com/aitestkitchen, /banners/ paths) that a naive
//     `document.querySelector('video')` will match instead of the real
//     result. Every video query here explicitly excludes those.
//   - GOTCHA: click_at_xy coordinates must be in PAGE space, not screenshot
//     pixel space (screenshot is 2x page viewport). Always derive
//     coordinates via getBoundingClientRect() in js() first.

import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { runHarness as runHarnessBase, parseLastJson as parseLastJsonBase } from './_harness.mjs';

const ERROR_PREFIX = 'FLOW_STEP_FAILED';

function runHarness(pythonSrc, opts = {}) {
  return runHarnessBase(pythonSrc, {
    errorPrefix: ERROR_PREFIX,
    logPrefix: 'flow',
    timeoutMs: 90 * 1000, // video steps (especially poll iterations) can be slower
    ...opts,
  });
}

function parseLastJson(stdout, label) {
  return parseLastJsonBase(stdout, label, ERROR_PREFIX);
}

// ---- Constants ------------------------------------------------------------

const FLOW_URL = 'https://labs.google/fx/tools/flow';
const POLL_INTERVAL_MS = 12000;
const POLL_MAX_MS = 5 * 60 * 1000; // 5 minutes, generous given video gen latency

const CHECK_SIGNIN_JS = `
(() => {
  const text = document.body.innerText || '';
  return /sign in/i.test(text) && /google/i.test(text);
})()
`.trim();

const EXCLUDE_SRC_PATTERNS_JS = `
  const isDecorative = (src) => {
    if (!src) return true;
    return /gstatic\\.com\\/aitestkitchen/i.test(src) || /\\/banners\\//i.test(src);
  };
`.trim();

// ---- Steps ----------------------------------------------------------------

async function stepOpenAndHandleOnboarding(job) {
  const targetUrl = job.existingProjectUrl || FLOW_URL;
  const py = `
import json
new_tab(${JSON.stringify(targetUrl)})
wait_for_load()
signed_out = js(${JSON.stringify(CHECK_SIGNIN_JS)})
print(json.dumps({"signed_out": signed_out}))
`;
  const out = await runHarness(py, { label: 'open_flow' });
  const result = parseLastJson(out, 'open_flow');
  if (result.signed_out) {
    throw new Error('AUTH_REQUIRED: log into Google in Chrome');
  }

  // Check for the one-time consent modal ("Experience and shape AI tools for
  // creativity"). Only handle it if present — returning users skip it.
  const findConsentModalJs = `
(() => {
  const heading = Array.from(document.querySelectorAll('h1, h2, h3, div'))
    .find(el => /experience and shape ai tools/i.test(el.textContent || ''));
  if (!heading) return { found: false };
  const nextBtn = Array.from(document.querySelectorAll('button'))
    .find(el => /^next$/i.test((el.textContent || '').trim()));
  if (!nextBtn) return { found: true, hasNext: false };
  const rect = nextBtn.getBoundingClientRect();
  return { found: true, hasNext: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const pyCheck = `
import json
loc = js(${JSON.stringify(findConsentModalJs)})
print(json.dumps(loc))
`;
  const outCheck = await runHarness(pyCheck, { label: 'check_consent_modal' });
  const consentLoc = parseLastJson(outCheck, 'check_consent_modal');

  if (consentLoc.found) {
    console.log('[flow] check_consent_modal: consent modal present, leaving both checkboxes unchecked (privacy-preserving default)');
    if (!consentLoc.hasNext) {
      throw new Error(`${ERROR_PREFIX}[consent_modal]: modal detected but "Next" button not found`);
    }
    const pyNext = `
click_at_xy(${consentLoc.x}, ${consentLoc.y})
capture_screenshot()
`;
    await runHarness(pyNext, { label: 'consent_modal_click_next' });

    // Privacy policy modal: repeats for up to 2 pages. "Continue" starts
    // disabled and only enables after scrolling its text container to the
    // bottom. Handle up to 2 iterations defensively.
    for (let page = 1; page <= 2; page += 1) {
      const scrollAndCheckJs = `
(() => {
  const heading = Array.from(document.querySelectorAll('h1, h2, h3, div'))
    .find(el => /review our privacy policy/i.test(el.textContent || ''));
  if (!heading) return { present: false };
  // Find the scrollable text container: the largest scrollable element.
  const scrollables = Array.from(document.querySelectorAll('div'))
    .filter(el => el.scrollHeight > el.clientHeight + 20);
  const container = scrollables.sort((a, b) =>
    (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight)
  )[0];
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
  const continueBtn = Array.from(document.querySelectorAll('button'))
    .find(el => /^continue$/i.test((el.textContent || '').trim()));
  if (!continueBtn) return { present: true, hasContinue: false };
  const rect = continueBtn.getBoundingClientRect();
  const disabled = continueBtn.disabled || continueBtn.getAttribute('aria-disabled') === 'true';
  return { present: true, hasContinue: true, disabled, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

      const pyScroll = `
import json
loc = js(${JSON.stringify(scrollAndCheckJs)})
print(json.dumps(loc))
`;
      const outScroll = await runHarness(pyScroll, { label: `privacy_policy_page_${page}_scroll` });
      const policyLoc = parseLastJson(outScroll, `privacy_policy_page_${page}_scroll`);

      if (!policyLoc.present) {
        break; // policy modal already closed / not present for this page
      }
      if (!policyLoc.hasContinue) {
        throw new Error(`${ERROR_PREFIX}[privacy_policy_page_${page}]: modal detected but "Continue" button not found`);
      }
      if (policyLoc.disabled) {
        // give the enable-on-scroll handler a brief moment to react, then re-check once
        await new Promise((r) => setTimeout(r, 800));
      }
      const pyContinue = `
click_at_xy(${policyLoc.x}, ${policyLoc.y})
capture_screenshot()
`;
      await runHarness(pyContinue, { label: `privacy_policy_page_${page}_click_continue` });
    }
  } else {
    console.log('[flow] check_consent_modal: not present, assuming returning user (one-time modal already dismissed)');
  }
}

async function stepEnterProject(job) {
  if (job.existingProjectUrl) {
    // Already navigated directly to it in stepOpenAndHandleOnboarding.
    return;
  }

  const findNewProjectJs = `
(() => {
  const tile = Array.from(document.querySelectorAll('button, [role="button"], div'))
    .find(el => /\\+\\s*new project/i.test((el.textContent || '').trim()));
  if (!tile) return { found: false };
  const rect = tile.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py = `
import json
loc = js(${JSON.stringify(findNewProjectJs)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'find_new_project_tile' });
  const loc = parseLastJson(out, 'find_new_project_tile');
  if (!loc.found) {
    throw new Error(`${ERROR_PREFIX}[find_new_project_tile]: could not locate "+ New project" tile`);
  }

  const py2 = `
click_at_xy(${loc.x}, ${loc.y})
wait_for_load()
capture_screenshot()
`;
  await runHarness(py2, { label: 'click_new_project_tile' });
}

async function stepTypePromptAndSubmit(job) {
  const findChatInputJs = `
(() => {
  const el = document.querySelector('textarea[placeholder*="What do you want to create" i], [contenteditable="true"]');
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 5) return { found: false };
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py = `
import json
loc = js(${JSON.stringify(findChatInputJs)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'find_chat_input' });
  const loc = parseLastJson(out, 'find_chat_input');
  if (!loc.found) {
    throw new Error(`${ERROR_PREFIX}[find_chat_input]: could not locate agent chat input`);
  }

  const promptParts = [job.prompt];
  if (job.negativePrompt) promptParts.push(`(avoid: ${job.negativePrompt})`);
  if (job.durationSec) promptParts.push(`Duration: ${job.durationSec} seconds.`);
  const promptText = promptParts.join('\n\n');

  const py2 = `
click_at_xy(${loc.x}, ${loc.y})
type_text(${JSON.stringify(promptText)})
capture_screenshot()
`;
  await runHarness(py2, { label: 'type_chat_prompt' });

  const findSendButtonJs = `
(() => {
  const btn = document.querySelector('button[aria-label*="Send" i]') ||
    Array.from(document.querySelectorAll('button')).find(el => (el.getAttribute('aria-label') || '').toLowerCase().includes('send'));
  if (!btn) return { found: false };
  const rect = btn.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()
`.trim();

  const py3 = `
import json
loc = js(${JSON.stringify(findSendButtonJs)})
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

// Detects, in one JS pass, all three states the agent panel can be in:
// (a) clarifying question with option rows, (b) cost-confirmation gate,
// (c) finished result thumbnail. Returns whichever is found (or none).
const DETECT_STATE_JS = `
(() => {
  const getRect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };

  // (b) Cost-confirmation gate: look for "Approve" / "Approve, do not ask
  // again" / "Reject" trio. Prioritize this over clarifying-question
  // detection since its option-row shape is similar.
  const allClickable = Array.from(document.querySelectorAll('button, [role="button"], div'));
  const approveExact = allClickable.find(el => (el.textContent || '').trim().toLowerCase() === 'approve');
  const approveNoAsk = allClickable.find(el => /approve, do not ask again/i.test((el.textContent || '').trim()));
  const rejectRow = allClickable.find(el => (el.textContent || '').trim().toLowerCase() === 'reject');
  if (approveExact && (approveNoAsk || rejectRow)) {
    const rect = getRect(approveExact);
    return { state: 'cost_confirmation', x: rect.x, y: rect.y };
  }

  // (a) Clarifying question with short option rows (e.g. "4 seconds" / "6 seconds").
  const shortRows = allClickable.filter(el => {
    const t = (el.textContent || '').trim();
    return t.length > 0 && t.length < 30 && el.children.length === 0;
  });
  // Heuristic: 2+ short sibling-like rows that look like discrete choices
  // (numeric/short words), and NOT the cost-confirmation trio (already
  // handled above).
  const optionCandidates = shortRows.filter(el => /^[a-z0-9][a-z0-9 ,.\\-]*$/i.test(el.textContent.trim()));
  if (optionCandidates.length >= 2) {
    const options = optionCandidates.slice(0, 8).map(el => {
      const rect = getRect(el);
      return { text: el.textContent.trim(), x: rect.x, y: rect.y };
    });
    return { state: 'clarifying_question', options };
  }

  // (c) Finished result: a project-grid tile or chat thumbnail with a
  // play-button overlay, containing a non-decorative <video> or its poster.
  ${EXCLUDE_SRC_PATTERNS_JS}
  const videos = Array.from(document.querySelectorAll('video'))
    .filter(v => !isDecorative(v.currentSrc || v.src));
  if (videos.length > 0) {
    return { state: 'finished' };
  }

  return { state: 'none' };
})()
`.trim();

async function stepPollAndDriveConversation(job) {
  const deadline = Date.now() + POLL_MAX_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    const py = `
import json
capture_screenshot()
result = js(${JSON.stringify(DETECT_STATE_JS)})
signed_out = js(${JSON.stringify(CHECK_SIGNIN_JS)})
print(json.dumps({"result": result, "signed_out": signed_out}))
`;
    const out = await runHarness(py, { label: `poll_attempt_${attempt}` });
    const parsed = parseLastJson(out, `poll_attempt_${attempt}`);

    if (parsed.signed_out) {
      throw new Error('AUTH_REQUIRED: log into Google in Chrome');
    }

    const state = parsed.result || { state: 'none' };

    if (state.state === 'finished') {
      return;
    }

    if (state.state === 'cost_confirmation') {
      console.log('[flow] poll: cost-confirmation gate detected, clicking plain "Approve"');
      const pyApprove = `
click_at_xy(${state.x}, ${state.y})
capture_screenshot()
`;
      await runHarness(pyApprove, { label: `poll_attempt_${attempt}_approve` });
      // Give the generation a moment to kick off before the next poll.
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    if (state.state === 'clarifying_question') {
      const options = state.options || [];
      const chosen = chooseClarifyingOption(options, job);
      if (!chosen) {
        throw new Error(`${ERROR_PREFIX}[clarifying_question]: no selectable option found among ${JSON.stringify(options)}`);
      }
      console.log(`[flow] poll: clarifying question detected, selecting "${chosen.text}"`);
      const pyChoose = `
click_at_xy(${chosen.x}, ${chosen.y})
capture_screenshot()
`;
      await runHarness(pyChoose, { label: `poll_attempt_${attempt}_choose_option` });
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    // state.state === 'none' (still generating / thinking) - keep polling.
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`${ERROR_PREFIX}[poll_and_drive_conversation]: timed out after 5 minutes waiting for video generation`);
}

// Picks the option textually closest to what was requested (numeric match
// against job.durationSec if present), else the first/safest (typically
// most-conservative / shortest-duration) option.
function chooseClarifyingOption(options, job) {
  if (!options || options.length === 0) return null;

  if (job.durationSec) {
    const target = Number(job.durationSec);
    let best = null;
    let bestDiff = Infinity;
    for (const opt of options) {
      const match = /(\d+(?:\.\d+)?)/.exec(opt.text);
      if (!match) continue;
      const val = Number(match[1]);
      const diff = Math.abs(val - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = opt;
      }
    }
    if (best) return best;
  }

  // No numeric match (or no durationSec given): fall back to the first
  // option, which is typically the most conservative/default choice.
  return options[0];
}

// ---- Video extraction -------------------------------------------------

const FIND_RESULT_VIDEO_JS = `
(() => {
  ${EXCLUDE_SRC_PATTERNS_JS}

  // Prefer a video within a chat-message-like container over a bare page video.
  const allVideos = Array.from(document.querySelectorAll('video'))
    .filter(v => !isDecorative(v.currentSrc || v.src));

  if (allVideos.length === 0) return { found: false };

  const inChatContainer = allVideos.find(v => v.closest('[class*="message" i], [class*="chat" i], [class*="thread" i]'));
  const video = inChatContainer || allVideos[0];

  const rect = video.getBoundingClientRect();
  const src = video.currentSrc || video.src || '';

  // Try to find a play-button overlay near the video's container to click,
  // in case the <video> itself isn't directly clickable/visible yet.
  const container = video.closest('div') || video;
  const playBtn = container.querySelector('[aria-label*="play" i], [class*="play" i]');
  let clickTarget = null;
  if (playBtn) {
    const pr = playBtn.getBoundingClientRect();
    clickTarget = { x: pr.x + pr.width / 2, y: pr.y + pr.height / 2 };
  }

  return {
    found: true,
    src,
    isBlob: src.startsWith('blob:'),
    videoRect: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    clickTarget,
  };
})()
`.trim();

async function stepExtractVideo() {
  const py = `
import json
loc = js(${JSON.stringify(FIND_RESULT_VIDEO_JS)})
print(json.dumps(loc))
`;
  const out = await runHarness(py, { label: 'find_result_video' });
  const loc = parseLastJson(out, 'find_result_video');

  if (!loc.found) {
    throw new Error(`${ERROR_PREFIX}[extract_video]: could not locate a non-decorative result <video> element`);
  }

  // Click the play-button overlay (or the video itself) to confirm/reveal it,
  // then re-query to get the final currentSrc.
  const clickX = loc.clickTarget ? loc.clickTarget.x : loc.videoRect.x;
  const clickY = loc.clickTarget ? loc.clickTarget.y : loc.videoRect.y;
  const py2 = `
click_at_xy(${clickX}, ${clickY})
capture_screenshot()
`;
  await runHarness(py2, { label: 'click_result_video' });

  const py3 = `
import json
loc = js(${JSON.stringify(FIND_RESULT_VIDEO_JS)})
print(json.dumps(loc))
`;
  const out3 = await runHarness(py3, { label: 'reconfirm_result_video' });
  const finalLoc = parseLastJson(out3, 'reconfirm_result_video');

  if (!finalLoc.found) {
    throw new Error(`${ERROR_PREFIX}[extract_video]: result video disappeared after click`);
  }

  if (finalLoc.isBlob) {
    throw new Error(
      `${ERROR_PREFIX}[extract_video]: blob: video URLs are not currently supported, needs a MediaRecorder-based capture`
    );
  }

  if (!finalLoc.src || !/^https?:\/\//i.test(finalLoc.src)) {
    throw new Error(`${ERROR_PREFIX}[extract_video]: result video has no usable http(s) src (got: ${finalLoc.src})`);
  }

  return finalLoc.src;
}

async function stepDownloadVideo(videoUrl) {
  const dir = await mkdtemp(path.join(tmpdir(), 'browser-worker-flow-'));
  const filePath = path.join(dir, `output-${Date.now()}.mp4`);

  const py = `
import json, base64
data = http_get(${JSON.stringify(videoUrl)})
if isinstance(data, (bytes, bytearray)):
    encoded = base64.b64encode(data).decode('ascii')
elif isinstance(data, dict) and 'content' in data:
    encoded = data['content']
else:
    encoded = base64.b64encode(str(data).encode('utf-8')).decode('ascii')
print(json.dumps({"b64": encoded}))
`;
  const out = await runHarness(py, { label: 'download_video_http_get', timeoutMs: 120 * 1000 });
  const parsed = parseLastJson(out, 'download_video_http_get');
  const buf = Buffer.from(parsed.b64, 'base64');
  await writeFile(filePath, buf);
  return filePath;
}

// ---- Public entry point ----------------------------------------------------

/**
 * Run the Flow (labs.google/fx) video generation playbook for one job.
 * @param {object} job - BrowserGenJob row, plus optional job.existingProjectUrl
 *   to resume/poll a job already in flight instead of creating a fresh project.
 * @returns {Promise<{filePath: string, projectUrl: string}>}
 */
export async function runFlowJob(job) {
  if (!job || !job.prompt) {
    throw new Error(`${ERROR_PREFIX}[validate_job]: job.prompt is required`);
  }

  await stepOpenAndHandleOnboarding(job);
  await stepEnterProject(job);
  await stepTypePromptAndSubmit(job);
  await stepPollAndDriveConversation(job);
  const videoUrl = await stepExtractVideo();
  const filePath = await stepDownloadVideo(videoUrl);

  // Capture the final project URL so callers can resume/poll later if needed.
  const py = `
import json
info = page_info()
print(json.dumps({"url": info.get("url")}))
`;
  const out = await runHarness(py, { label: 'capture_project_url' });
  const parsed = parseLastJson(out, 'capture_project_url');
  const projectUrl = parsed.url || job.existingProjectUrl || null;

  return { filePath, projectUrl };
}

export default runFlowJob;
