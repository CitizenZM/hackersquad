export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CreativeIntel OS";

export const CATEGORIES = [
  "Beauty & Skincare",
  "Health & Wellness",
  "Fashion & Apparel",
  "Food & Beverage",
  "Electronics & Tech",
  "Home & Living",
  "Fitness & Sports",
  "Pet Products",
  "Baby & Kids",
  "Jewelry & Accessories",
  "Outdoor & Travel",
  "Automotive",
  "Financial Services",
  "SaaS & Software",
  "Education",
  "Entertainment",
  "Other",
] as const;

export const CAMPAIGN_GOALS = [
  "Direct Conversion",
  "Product Education",
  "Creator Seeding",
  "Affiliate Content",
  "Seasonal Sale",
  "New Product Launch",
  "Landing Page Hero Video",
  "Amazon PDP Video",
  "TikTok Shop Ad",
  "Brand Awareness",
  "Retargeting",
] as const;

export const NARRATIVE_TYPE_LABELS: Record<string, string> = {
  PROBLEM_SOLUTION: "Problem / Solution",
  TESTIMONIAL: "Testimonial",
  DEMONSTRATION: "Demonstration",
  LIFESTYLE: "Lifestyle",
  EDUCATIONAL: "Educational",
  COMPARISON: "Comparison",
  STORY_ARC: "Story Arc",
  UGC_STYLE: "UGC Style",
  TREND_RIDING: "Trend Riding",
  BEFORE_AFTER: "Before / After",
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  OFFICIAL_API: "Official API",
  PUBLIC_WEB: "Public Web",
  USER_INPUT: "User Input",
  AI_INFERRED: "AI Inferred",
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  YOUTUBE_VIDEO: "YouTube Video",
  WEBSITE_PAGE: "Website Page",
  SOCIAL_POST: "Social Post",
  WEB_MENTION: "Web Mention",
  REVIEW: "Review",
};
