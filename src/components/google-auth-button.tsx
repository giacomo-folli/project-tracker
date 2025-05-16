"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";

type GoogleAuthButtonProps = {
  mode?: "sign-in" | "sign-up";
  redirectTo?: string;
};

export default function GoogleAuthButton({
  mode = "sign-in",
  redirectTo = "/dashboard",
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // For development/testing purposes, allow email login instead when Google is not configured
      // This is a fallback for environments where Google OAuth is not set up
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        // Special handling for the "provider not enabled" error
        if (error.message.includes("provider is not enabled")) {
          setAuthError(
            "Google authentication is not configured. Please use email login instead or contact the administrator.",
          );
        } else {
          setAuthError(error.message);
        }
        console.error("Google sign-in error:", error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setAuthError(errorMessage);
      console.error("Unexpected error during Google sign-in:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2 py-5 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Image
          src="/images/google-logo.svg"
          alt="Google logo"
          width={20}
          height={20}
        />
        {isLoading
          ? "Connecting..."
          : `Continue with Google${mode === "sign-up" ? " (Sign Up)" : ""}`}
      </Button>
      {authError && <p className="text-sm text-red-500 mt-2">{authError}</p>}
    </div>
  );
}
