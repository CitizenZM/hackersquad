# browser-worker

Local Mac worker daemon that executes `BrowserGenJob` rows by driving the
operator's **already-logged-in** Chrome via [`browser-harness`](https://github.com/)
(CDP control on `$PATH`). It talks only to the deployed app's worker HTTP API
(`/api/worker/browser-jobs`) — it never touches the database directly.

## Contract assumed

`POST {APP_URL}/api/worker/browser-jobs` with header `x-worker-token: $BROWSER_WORKER_TOKEN`:

| action        | request body                                  | response                        |
|---------------|------------------------------------------------|----------------------------------|
| `claim`       | `{ action: "claim", workerId, sites: string[] }` | `{ job: BrowserGenJob \| null }` |
| `complete`    | `{ action: "complete", id, resultUrl }`         | `{ ok: true }` (or similar)      |
| `fail`        | `{ action: "fail", id, error }`                 | `{ ok: true }`                   |
| `heartbeat`   | `{ action: "heartbeat", id, workerId }`         | `{ ok: true }`                   |

`sites` restricts claiming to the sites this worker instance implements
(`WORKER_SITES` env, default `ai_studio`). The worker sends a heartbeat every
60s while a job is running, and caps itself to one job at a time (claim →
run to completion/failure → claim again).

## Setup

```bash
cd workers/browser-worker
npm install
```

### Required environment variables

| Var                       | Required | Default                              | Notes |
|---------------------------|----------|---------------------------------------|-------|
| `APP_URL`                 | no       | `https://creativeintel.vercel.app`     | Base URL of the deployed app |
| `BROWSER_WORKER_TOKEN`    | **yes**  | —                                       | Must match the API's expected worker token |
| `WORKER_SITES`            | no       | `ai_studio`                            | Comma-separated: `ai_studio,flow,kling` |
| `POLL_INTERVAL_MS`        | no       | `20000`                                | Delay between claim attempts when idle |
| `CLOUDINARY_URL`          | one of   | —                                       | `cloudinary://key:secret@cloud_name` form |
| `CLOUDINARY_CLOUD_NAME`   | this     | —                                       | Alternative to `CLOUDINARY_URL` |
| `CLOUDINARY_API_KEY`      | group    | —                                       | ″ |
| `CLOUDINARY_API_SECRET`   | is req.  | —                                       | ″ |

Set these in your shell profile, a `.env` loaded by your process manager, or
directly in the launchd plist's `EnvironmentVariables` block (see below).

### Prerequisites

- **Chrome must be running** with the `browser-harness` daemon reachable
  (`browser-harness` is on `$PATH` — see `~/Developer/browser-harness/SKILL.md`).
- **You must be logged into Google** (for `ai_studio`/`flow`) and/or **Kling**
  (for `kling`) in that Chrome profile. This worker never enters credentials —
  if it hits a sign-in wall it fails the job with
  `AUTH_REQUIRED: log into Google in Chrome` (or Kling equivalent) so you can
  log in manually and let the next poll retry.
- `ai_studio` (site key, kept for backward compatibility with existing job
  rows/queue configs) and `flow` are implemented today. `kling` is still a
  stub that throws `NOT_IMPLEMENTED` — enabling it in `WORKER_SITES` will just
  cause those claimed jobs to fail immediately with that error, which is
  expected until it's built out.

### Important: `ai_studio` now means Gemini App, not AI Studio

A manual live test found that **aistudio.google.com (the dev console) is a
dead end** for token-free generation — its Nano Banana image models require a
linked **paid API billing account** ("Link a paid API key here"). That path
was abandoned.

**gemini.google.com (the consumer Gemini App) DOES work token-free**,
generating images against the account's existing Pro subscription quota with
zero API key. The `playbooks/gemini-app.mjs` file implements this, and the
`ai_studio` site key (in `WORKER_SITES` and `BrowserGenJob.site`) is kept
as-is for compatibility but now dispatches to `runGeminiAppJob`. The old
`playbooks/ai-studio.mjs` (which targeted the dead-end dev console) has been
removed.

**Flow (`playbooks/flow.mjs`) is also now implemented**, targeting
`labs.google/fx/tools/flow` for token-free video generation (confirmed
generating a real 6-second video via Veo under the hood, using existing
account quota). It handles the one-time onboarding/consent modal, drives the
in-project agent chat panel, auto-answers clarifying questions (e.g. video
duration) and the cost-confirmation gate (always clicking plain "Approve",
never "Approve, do not ask again"), and extracts the finished video.

## Running

```bash
cd workers/browser-worker
BROWSER_WORKER_TOKEN=xxx \
CLOUDINARY_URL=cloudinary://key:secret@cloud_name \
node worker.mjs
```

Logs print to stdout/stderr with ISO timestamps and the worker's instance ID,
e.g.:

```
[2026-07-11T18:00:00.000Z] [mac-browser-worker-a1b2c3d4] starting. APP_URL=... WORKER_SITES=ai_studio POLL_INTERVAL_MS=20000
[2026-07-11T18:00:20.100Z] [mac-browser-worker-a1b2c3d4] claimed job ck123... (site=ai_studio, kind=image_keyframe)
```

Stop with `Ctrl-C` (SIGINT) or `kill <pid>` (SIGTERM) — the worker finishes
its current job/loop iteration before exiting; it does not forcibly kill an
in-flight browser-harness step.

## Keeping it running with launchd

Create `~/Library/LaunchAgents/com.celldigital.browser-worker.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.celldigital.browser-worker</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/barrom/Projects/hackersquad/workers/browser-worker/worker.mjs</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/barrom/Projects/hackersquad/workers/browser-worker</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>APP_URL</key>
    <string>https://creativeintel.vercel.app</string>
    <key>BROWSER_WORKER_TOKEN</key>
    <string>REPLACE_ME</string>
    <key>WORKER_SITES</key>
    <string>ai_studio</string>
    <key>CLOUDINARY_URL</key>
    <string>cloudinary://REPLACE_ME</string>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>

  <key>StandardOutPath</key>
  <string>/tmp/browser-worker.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/browser-worker.err.log</string>

  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

Then:

```bash
launchctl load ~/Library/LaunchAgents/com.celldigital.browser-worker.plist
# ... to stop/unload:
launchctl unload ~/Library/LaunchAgents/com.celldigital.browser-worker.plist
```

Adjust `/usr/local/bin/node` to your actual `node` path (`which node`), and
make sure `PATH` in the plist includes wherever `browser-harness` lives (it
must be resolvable exactly as it would be in your interactive shell).

## Testing one job end-to-end

1. Confirm Chrome is open and you're logged into Google.
2. Enqueue a job via the app's worker API (or however the app creates
   `BrowserGenJob` rows — e.g. its own internal "create job" endpoint). If you
   just want to exercise the worker's claim loop directly against a job
   someone already created:

   ```bash
   curl -s -X POST https://creativeintel.vercel.app/api/worker/browser-jobs \
     -H 'content-type: application/json' \
     -H 'x-worker-token: REPLACE_ME' \
     -d '{"action":"claim","workerId":"manual-test","sites":["ai_studio"]}'
   ```

3. Start the worker (`node worker.mjs`) and watch the logs — it should claim
   the job, drive Gemini App, upload to Cloudinary, and call `complete`.
4. To simulate failure handling without a real browser session, temporarily
   unset `BROWSER_WORKER_TOKEN` or point `WORKER_SITES` at an unimplemented
   site like `kling` and confirm the API receives a `fail` call with
   `NOT_IMPLEMENTED`.

## Known gotchas

Field-tested during manual live testing of `gemini-app.mjs` and `flow.mjs`:

- **Coordinate space**: `capture_screenshot()` returns an image at
  **2x devicePixelRatio** relative to the actual page viewport (e.g. a
  2400x1720 screenshot for a 1200x860 page). Never eyeball screenshot pixel
  positions and pass them to `click_at_xy` directly. The reliable pattern:
  use `js()` with `document.querySelector(...)` / `getBoundingClientRect()`
  to compute an element's real page-space center coordinates, then call
  `click_at_xy` with those exact numbers.
- **Flow's decorative banner videos**: Flow's pages contain multiple
  `<video>` elements — decorative promo/banner carousel videos elsewhere on
  the page (e.g. `gstatic.com/aitestkitchen` or `/banners/` URLs) that WILL
  match a naive `document.querySelector('video')`. Any DOM query for "the
  generated video" must explicitly exclude any video/img whose src contains
  `gstatic.com/aitestkitchen` or `/banners/`, and prefer elements inside a
  chat-message/result container. See `EXCLUDE_SRC_PATTERNS_JS` in
  `playbooks/flow.mjs`.
- **Gemini App image extraction via blob: URLs fails silently**: the
  generated `<img>`'s `src` is a `blob:` URL, and directly `fetch()`-ing or
  XHR-ing it from a CDP `Runtime.evaluate` injected context fails (silently,
  or with a generic "Failed to fetch"). The reliable extraction method — and
  the one used as the PRIMARY method in `gemini-app.mjs`, not a fallback —
  is to draw the `<img>` onto an off-screen `<canvas>` and call
  `canvas.toDataURL('image/png')` to get a base64 PNG directly, bypassing
  the blob URL entirely.
- **Flow's cost-confirmation gate**: always click plain "Approve", never
  "Approve, do not ask again" — the latter silently disables future
  confirmations, removing a safety check a human should keep.
- **Flow's `blob:` video src** is not currently supported for download (would
  need a `MediaRecorder`-based capture); `flow.mjs` throws a clear
  `FLOW_STEP_FAILED[extract_video]: blob: video URLs are not currently
  supported...` error rather than failing silently if this is ever hit.

## Caveat

This entire worker depends on a **real, visible Chrome window already logged
into the target sites** on the Mac it runs on. It is not headless and not
containerized — it is browser automation over the operator's actual browser
session. If Chrome quits, crashes, or gets signed out, jobs will fail with
`AUTH_REQUIRED` (or a step-specific error) until someone manually restores
that session.
