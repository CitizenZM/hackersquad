export function getBriefingContext(
  briefingText: string | null | undefined,
  briefingParsed: string | null | undefined,
  maxChars = 2000
): string {
  const parts: string[] = [];
  if (briefingText) parts.push(briefingText);
  if (briefingParsed) parts.push(briefingParsed);
  if (parts.length === 0) return "";
  const combined = parts.join("\n\n").slice(0, maxChars);
  return `\n\nProject Briefing:\n${combined}`;
}
