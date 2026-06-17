import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Shield, Trash2, Info, ExternalLink } from "lucide-react";
import { ClearHistoryButton } from "./clear-history-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div>
      <ParentHeader title="Settings" description="App preferences and data management" />
      <div className="p-6 space-y-6 max-w-2xl">
        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" /> About StoryNest Kids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>Web + iOS (Capacitor)</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Privacy & Safety
            </CardTitle>
            <CardDescription>
              StoryNest Kids is designed for children aged 3-9 and complies with COPPA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/privacy" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              Privacy Policy
            </Link>
            <p className="text-xs text-muted-foreground">
              No ads, no tracking, no social features in the child experience.
              All content is parent-controlled and reviewed before publishing.
            </p>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can delete your child&apos;s listening history at any time.
              Story content and profiles will be preserved.
            </p>
            <ClearHistoryButton />
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>Questions? Contact us at <strong>support@storynest.app</strong></p>
            <p className="mt-1 text-xs">Made with love for families everywhere</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
