// playbooks/_harness.mjs
//
// Tiny shared helpers used by every browser-harness-driven playbook
// (gemini-app.mjs, flow.mjs, kling.mjs). Kept intentionally small — no
// retries framework, no config system, just the two things every playbook
// needs: run a heredoc Python script through the `browser-harness` CLI, and
// parse the last JSON value it printed to stdout.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const DEFAULT_STEP_TIMEOUT_MS = 60 * 1000;

/**
 * Run a Python heredoc script through `browser-harness` and return stdout.
 * Throws `Error("<errorPrefix>[<label>]: <message>")` on failure so callers
 * can identify exactly which step broke.
 */
export async function runHarness(
  pythonSrc,
  { label, errorPrefix, timeoutMs = DEFAULT_STEP_TIMEOUT_MS, logPrefix = errorPrefix } = {}
) {
  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      ['-c', `browser-harness <<'PY'\n${pythonSrc}\nPY`],
      { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 }
    );
    if (stderr && stderr.trim()) {
      console.log(`[${logPrefix}] (stderr) [${label}]`, stderr.trim().slice(0, 2000));
    }
    return stdout;
  } catch (err) {
    throw new Error(`${errorPrefix}[${label}]: ${err.message || err}`);
  }
}

/** Extract the last JSON value printed to stdout by a harness script. */
export function parseLastJson(stdout, label, errorPrefix) {
  const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // keep scanning backwards
    }
  }
  throw new Error(
    `${errorPrefix}[${label}]: could not parse JSON from harness output: ${stdout.slice(-500)}`
  );
}
