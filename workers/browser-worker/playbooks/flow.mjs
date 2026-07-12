// playbooks/flow.mjs
//
// TODO: Implement Google Labs "Flow" (labs.google/fx) video generation playbook.
//
// Intended flow (not yet implemented):
//   1. new_tab("https://labs.google/fx/tools/flow") -> wait_for_load()
//   2. Open (or create) a Flow project via the project picker UI.
//   3. Screenshot -> locate the prompt/text input for the project's scene.
//   4. Type job.prompt (and honor job.negativePrompt / job.aspectRatio / job.durationSec
//      if the UI exposes matching controls) into the input.
//   5. If job.inputImageUrl is set, use the "image to video" upload control instead of
//      pure text-to-video: download the source image locally first, then drive the
//      file input (see browser-harness interaction-skills/uploads.md).
//   6. Submit the generation request (this uses Veo under the hood).
//   7. Poll via screenshot every ~5s (cap ~3-5 min, Veo renders are slower than
//      Nano Banana stills) until a finished video thumbnail/player appears.
//   8. Extract the rendered video: prefer the built-in "Download" button if present
//      (drives a real download via browser-harness downloads.md helpers), otherwise
//      find the <video>/<source> src via js() and fetch it to a temp file.
//   9. Return { filePath } pointing at the downloaded video file.
//
// Auth: if the page shows a Google "Sign in" wall, fail fast with
//   "AUTH_REQUIRED: log into Google in Chrome" — never attempt credentials.
//
// This stub only exists so WORKER_SITES gating in worker.mjs works end-to-end
// (unimplemented sites fail cleanly instead of silently no-op'ing).

export async function runFlowJob(_job) {
  throw new Error(
    'NOT_IMPLEMENTED: flow.mjs playbook (labs.google/fx Flow -> Veo video generation) is a stub. See TODO comments in this file.'
  );
}

export default runFlowJob;
