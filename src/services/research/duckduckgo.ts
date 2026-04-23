import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchDuckDuckGo(
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];
    $(".result").each((_, el) => {
      const titleEl = $(el).find(".result__title a");
      const title = titleEl.text().trim();
      let href = titleEl.attr("href") || "";

      // DuckDuckGo wraps URLs in redirects
      const udMatch = href.match(/uddg=([^&]+)/);
      if (udMatch) href = decodeURIComponent(udMatch[1]);

      const snippet = $(el).find(".result__snippet").text().trim();

      if (title && href) {
        results.push({ title, url: href, snippet });
      }
    });

    return results.slice(0, maxResults);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
