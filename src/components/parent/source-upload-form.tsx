"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { estimateEpisodeCount } from "@/lib/constants";
import { Upload, FileText, Type, BookOpen } from "lucide-react";

export function SourceUploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [fileData, setFileData] = useState<{
    fileUrl: string;
    text: string;
    wordCount: number;
    fileName: string;
  } | null>(null);

  const wordCount = fileData?.wordCount || textContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = fileData ? (fileData.text?.length ?? 0) : textContent.length;
  const readingMinutes = wordCount > 0 ? Math.ceil(wordCount / 150) : 0;
  const episodeEstimate = estimateEpisodeCount(wordCount);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const data = await res.json();
      setFileData(data);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setError("Failed to upload file");
    } finally {
      setLoading(false);
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const rawText = fileData?.text || textContent;
    if (!rawText.trim()) {
      setError("Content is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: fileData ? "PDF_UPLOAD" : "TEXT_PASTE",
          title: title.trim(),
          rawText,
          fileUrl: fileData?.fileUrl,
          wordCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/sources");
        router.refresh();
      }, 1200);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 font-medium">
            Content saved! Redirecting to your sources...
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this content a name"
            required
          />
        </div>

        <Tabs defaultValue="paste">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-2">
              <Type className="h-4 w-4" /> Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" /> Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                setFileData(null);
              }}
              placeholder="Paste your story, article, or educational content here..."
              className="min-h-[200px]"
            />
          </TabsContent>

          <TabsContent value="upload">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <input {...getInputProps()} />
              {fileData ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-primary" />
                  <p className="font-medium">{fileData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive ? "Drop file here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, DOC, DOCX, and TXT files
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {wordCount > 0 && (
          <div className="rounded-lg bg-secondary p-4 space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Words</div>
                <div className="font-semibold">{wordCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Characters</div>
                <div className="font-semibold">{charCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Reading time</div>
                <div className="font-semibold">
                  {readingMinutes} {readingMinutes === 1 ? "min" : "mins"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Estimated episodes</span>
              </div>
              <span className="text-2xl font-bold text-primary">{episodeEstimate}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading || wordCount === 0}>
            {loading ? "Saving..." : "Save Source"}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
