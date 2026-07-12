// playbooks/kling.mjs
//
// TODO: Implement Kling AI (app.klingai.com) text-to-video / image-to-video playbook.
//
// Intended flow (not yet implemented):
//   1. new_tab("https://app.klingai.com/global/text-to-video") for text-only jobs,
//      or the image-to-video tab/route when job.inputImageUrl is present.
//      wait_for_load() after navigation.
//   2. If job.inputImageUrl is set: download the source image locally, then drive
//      Kling's image upload dropzone (see browser-harness interaction-skills/uploads.md)
//      to attach it as the first frame.
//   3. Screenshot -> locate the prompt textarea, type job.prompt
//      (and job.negativePrompt into the negative-prompt field if exposed).
//   4. Apply aspect ratio / duration controls to match job.aspectRatio / job.durationSec
//      if the UI exposes matching selectors.
//   5. Click "Generate" (may consume credits — confirm credits/plan gating is visible
//      before assuming failure is a bug).
//   6. Poll via screenshot every ~5s (cap ~3-5 min; Kling renders can be slow and
//      queue behind other jobs in the account) until the generated video card appears
//      in the results panel.
//   7. Extract the result: prefer the site's own "Download" action (drives a real
//      browser download), otherwise find the rendered <video>/<source> src via js()
//      and fetch it to a temp file.
//   8. Return { filePath } pointing at the downloaded video file.
//
// Auth: if the page shows a Kling/Google "Sign in" wall, fail fast with
//   "AUTH_REQUIRED: log into Kling in Chrome" — never attempt credentials.
//
// This stub only exists so WORKER_SITES gating in worker.mjs works end-to-end
// (unimplemented sites fail cleanly instead of silently no-op'ing).

export async function runKlingJob(_job) {
  throw new Error(
    'NOT_IMPLEMENTED: kling.mjs playbook (app.klingai.com text/image-to-video) is a stub. See TODO comments in this file.'
  );
}

export default runKlingJob;
