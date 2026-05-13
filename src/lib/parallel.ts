export interface PMapOptions {
  concurrency?: number;
}

export async function pMap<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  options: PMapOptions = {}
): Promise<R[]> {
  const concurrency = Math.max(1, options.concurrency ?? 5);
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function pMapSettled<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  options: PMapOptions = {}
): Promise<PromiseSettledResult<R>[]> {
  const concurrency = Math.max(1, options.concurrency ?? 5);
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      try {
        const value = await fn(items[idx], idx);
        results[idx] = { status: "fulfilled", value };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  });

  await Promise.all(workers);
  return results;
}
