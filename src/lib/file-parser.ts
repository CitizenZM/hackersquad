function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function parseText(text: string): { text: string; wordCount: number } {
  const cleaned = text.trim();
  return { text: cleaned, wordCount: countWords(cleaned) };
}

export async function parsePdf(
  buffer: Buffer
): Promise<{ text: string; wordCount: number }> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text.trim();
  return { text, wordCount: countWords(text) };
}

export async function parseDoc(
  buffer: Buffer
): Promise<{ text: string; wordCount: number }> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return { text, wordCount: countWords(text) };
}

export function parseTxt(
  buffer: Buffer
): { text: string; wordCount: number } {
  const text = buffer.toString("utf-8").trim();
  return { text, wordCount: countWords(text) };
}
