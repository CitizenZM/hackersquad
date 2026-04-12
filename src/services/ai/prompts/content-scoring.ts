import type { YouTubeVideo } from "@/services/research/youtube-service";

export function buildContentScoringPrompt(brandName: string, videos: YouTubeVideo[]) {
  const system = `You are a content performance analyst specializing in social media and video marketing.
Score each content asset on multiple dimensions (0-100 scale).
Respond with ONLY a JSON object matching this structure:
{
  "scores": [
    {
      "videoId": "string",
      "overallScore": number,
      "hookStrength": number,
      "productVisibility": number,
      "storytellingArc": number,
      "ctaQuality": number,
      "emotionalAppeal": number,
      "pacing": number,
      "hookText": "string - the likely opening hook based on title/description",
      "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
      "keyMessages": ["array of key messages"],
      "analysis": "string - brief explanation of why this content works or doesn't"
    }
  ]
}

Score criteria:
- hookStrength: How compelling is the title/opening? Does it create curiosity or urgency?
- productVisibility: How prominently is the product/brand featured?
- storytellingArc: Does the content have a clear narrative structure?
- ctaQuality: Is there a clear call-to-action?
- emotionalAppeal: Does it trigger an emotional response?
- pacing: Is the content well-structured for the platform?
- overallScore: Weighted average considering engagement metrics too`;

  const user = `Score these content assets related to "${brandName}":

${videos
  .map(
    (v, i) => `
[${i + 1}] Video ID: ${v.videoId}
Title: ${v.title}
Channel: ${v.channelTitle}
Description: ${v.description.slice(0, 500)}
Views: ${v.viewCount.toLocaleString()}
Likes: ${v.likeCount.toLocaleString()}
Comments: ${v.commentCount.toLocaleString()}
Published: ${v.publishedAt}
`
  )
  .join("\n")}`;

  return { system, user };
}
