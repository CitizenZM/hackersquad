// Instagram oEmbed connector.
//
// Meta's public oEmbed endpoint for Instagram has required an app access
// token since October 2020 (it's no longer a fully anonymous public
// endpoint). Shape:
//
//   GET https://graph.facebook.com/v19.0/instagram_oembed
//     ?url=<instagram-post-or-reel-url>
//     &access_token=<token>
//
// Success response (subset of fields we use):
//   { "author_name": "...", "html": "<blockquote ...>...</blockquote>",
//     "thumbnail_url": "...", "provider_name": "Instagram", ... }
//
// Error response: standard Graph API {error:{message,type,code}} shape.
//
// When no token is configured, we do NOT throw — we degrade to a minimal
// metadata object parsed from the URL itself (shortcode only, no thumbnail
// or author), since oEmbed is a "nice to have" enrichment, not a required
// research step.

import { cached } from "@/services/cache";
import { fetchWithRetry } from "./http";

export interface InstagramOembedResult {
  authorName?: string;
  thumbnailUrl?: string;
  html?: string;
  providerName?: string;
  /** Shortcode extracted from the URL, present in both the degraded and full paths. */
  shortcode?: string;
}

interface GraphApiErrorShape {
  error?: { message: string; type?: string; code?: number };
}

interface InstagramOembedResponse extends GraphApiErrorShape {
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
}

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

function extractShortcode(url: string): string | undefined {
  const match = url.match(/\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1];
}

async function fetchOembed(url: string, token: string): Promise<InstagramOembedResult> {
  const params = new URLSearchParams({ url, access_token: token });
  const requestUrl = `${GRAPH_API_BASE}/instagram_oembed?${params.toString()}`;

  const response = await fetchWithRetry(requestUrl, { method: "GET" });

  let body: InstagramOembedResponse;
  try {
    body = (await response.json()) as InstagramOembedResponse;
  } catch {
    // Degrade gracefully rather than throwing — oEmbed is enrichment only.
    return { shortcode: extractShortcode(url) };
  }

  if (body.error || !response.ok) {
    return { shortcode: extractShortcode(url) };
  }

  return {
    authorName: body.author_name,
    thumbnailUrl: body.thumbnail_url,
    html: body.html,
    providerName: body.provider_name,
    shortcode: extractShortcode(url),
  };
}

/**
 * Fetch Instagram oEmbed metadata for a post/reel URL. Requires
 * META_ACCESS_TOKEN (Instagram oEmbed has required an app token since
 * 2020). When no token is configured, degrades to a minimal object with
 * just the shortcode parsed from the URL — never throws.
 */
export async function getInstagramOembed(url: string): Promise<InstagramOembedResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return { shortcode: extractShortcode(url) };
  }

  return cached<InstagramOembedResult>(
    {
      kind: "instagram-oembed",
      params: { url },
      ttlSec: 60 * 60 * 24 * 7, // 7 days
      schemaVersion: 1,
      cacheEmpty: false,
    },
    () => fetchOembed(url, token)
  );
}
