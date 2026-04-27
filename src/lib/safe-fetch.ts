export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Response was not JSON (e.g. Vercel timeout HTML page)
      data = null;
    }
    return { ok: res.ok && data !== null, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
