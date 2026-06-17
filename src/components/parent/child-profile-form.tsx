"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGE_GROUP_LABELS, LEARNING_MODE_LABELS } from "@/lib/constants";

interface ChildProfileFormProps {
  initialData?: {
    id: string;
    name: string;
    age: number;
    language: string;
    interests: string[];
    learningMode: string;
    pin?: string | null;
  };
}

export function ChildProfileForm({ initialData }: ChildProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      language: formData.get("language") as string || "en",
      interests: (formData.get("interests") as string).split(",").map(s => s.trim()).filter(Boolean),
      learningMode: formData.get("learningMode") as string || "LISTEN",
      pin: (formData.get("pin") as string) || undefined,
    };

    try {
      const url = isEditing ? `/api/children/${initialData.id}` : "/api/children";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/children");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Child Profile" : "Add Child Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Child&apos;s Name</Label>
            <Input id="name" name="name" defaultValue={initialData?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age ({Object.values(AGE_GROUP_LABELS).join(", ")})</Label>
            <Input
              id="age"
              name="age"
              type="number"
              min={3}
              max={9}
              defaultValue={initialData?.age || 5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input id="language" name="language" defaultValue={initialData?.language || "en"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              name="interests"
              placeholder="animals, space, dinosaurs"
              defaultValue={initialData?.interests?.join(", ")}
            />
            <div className="flex flex-wrap gap-1.5">
              {["animals", "space", "dinosaurs", "fairy tales", "adventure", "nature", "music", "science", "ocean", "magic"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    const input = document.getElementById("interests") as HTMLInputElement;
                    const current = input.value ? input.value.split(",").map(s => s.trim()).filter(Boolean) : [];
                    if (!current.includes(tag)) {
                      input.value = [...current, tag].join(", ");
                    }
                    (e.target as HTMLButtonElement).classList.add("opacity-50");
                  }}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="learningMode">Learning Mode</Label>
            <select
              id="learningMode"
              name="learningMode"
              defaultValue={initialData?.learningMode || "LISTEN"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {Object.entries(LEARNING_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN (optional 4-digit access code)</Label>
            <Input
              id="pin"
              name="pin"
              maxLength={4}
              pattern="\d{4}"
              placeholder="1234"
              defaultValue={initialData?.pin || ""}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Profile"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
