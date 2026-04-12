import { getAuthParent, unauthorized } from "@/lib/auth-middleware";
import { saveFile } from "@/services/upload/file-storage";
import { parsePdf, parseDoc, parseTxt } from "@/lib/file-parser";
import { estimateEpisodeCount } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await saveFile(buffer, file.name, file.type);

    let text = "";
    let wordCount = 0;

    if (file.type === "application/pdf") {
      const result = await parsePdf(buffer);
      text = result.text;
      wordCount = result.wordCount;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      const result = await parseDoc(buffer);
      text = result.text;
      wordCount = result.wordCount;
    } else if (file.type === "text/plain") {
      const result = parseTxt(buffer);
      text = result.text;
      wordCount = result.wordCount;
    } else {
      return Response.json(
        { error: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT." },
        { status: 400 }
      );
    }

    return Response.json({
      fileUrl,
      text,
      wordCount,
      estimatedEpisodes: estimateEpisodeCount(wordCount),
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to process file" }, { status: 500 });
  }
}
