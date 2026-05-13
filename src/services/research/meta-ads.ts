// Meta Ad Library connector — stub.
//
// Real implementation requires a Marketing API access token tied to a
// Business Manager account (env vars META_APP_ID, META_APP_SECRET,
// META_ACCESS_TOKEN). Approval is multi-week and is denied for most
// use cases that read competitor data. Public scraping of
// facebook.com/ads/library from Vercel functions is rate-limited and
// blocked by Akamai/datadome.
//
// This stub returns [] so the caller can wire the integration point
// without blocking the sprint. A future sprint should run the Meta
// connector on a background worker with residential proxies.

export interface MetaAd {
  adId: string;
  pageId: string;
  pageName: string;
  adSnapshotUrl: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  creativeBody?: string;
  creativeImageUrl?: string;
  creativeVideoUrl?: string;
  spend?: { lower?: number; upper?: number; currency?: string };
  impressions?: { lower?: number; upper?: number };
}

export interface MetaSearchOptions {
  brand: string;
  countries?: string[];
  limit?: number;
}

export async function searchMetaAdLibrary(
  _options: MetaSearchOptions
): Promise<MetaAd[]> {
  if (!process.env.META_ACCESS_TOKEN) return [];
  // TODO: implement real Marketing API call when credentials provisioned.
  return [];
}
