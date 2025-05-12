"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function DebugFeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createDebugFeedItem = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/debug-feed");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create debug feed item");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Feed Debugging Tools</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Debug Feed Item</CardTitle>
          <CardDescription>
            This will create a test feed item to verify that the feed system is
            working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Clicking the button below will:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
            <li>Check if you have any projects (create one if needed)</li>
            <li>
              Check if the project has any milestones (create one if needed)
            </li>
            <li>Create a feed item for that milestone</li>
          </ul>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4 flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{result.message}</p>
                <p className="text-sm mt-2">
                  Feed item created with ID: {result.feedItem?.id}
                </p>
                <p className="text-sm">Project: {result.project?.name}</p>
                {typeof result.milestone === "string" ? (
                  <p className="text-sm">{result.milestone}</p>
                ) : (
                  <p className="text-sm">
                    Milestone: {result.milestone?.title}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={createDebugFeedItem} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Debug Feed Item"}
          </Button>

          <Button variant="outline" asChild>
            <Link href="/dashboard/feed">Go to Feed</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>If you&apos;re experiencing issues with the feed:</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>Make sure you have at least one project</li>
          <li>Make sure the project has at least one milestone</li>
          <li>Try completing a milestone to generate feed activity</li>
          <li>Check the browser console for any error messages</li>
        </ol>
      </div>
    </div>
  );
}
