const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MIN_DELAY_MS = 1500;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestTime = 0;

export const fetchWithRetry = async (
  url: string,
  maxRetries = 3
): Promise<string | null> => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      lastRequestTime = Date.now();
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${url} (attempt ${attempt}/${maxRetries})`);
        if (attempt < maxRetries) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        return null;
      }

      return await res.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Fetch error for ${url}: ${msg} (attempt ${attempt}/${maxRetries})`);
      if (attempt < maxRetries) {
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  return null;
};
