"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

type GoogleAuthButtonProps = {
  mode: "sign-in" | "sign-up";
  className?: string;
};

export default function GoogleAuthButton({
  mode,
  className,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google auth error:", error);
        setAuthError(error.message);
        throw error;
      }
    } catch (error) {
      console.error("Failed to authenticate with Google:", error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 ${className}`}
      >
        {isLoading ? (
          <span className="animate-spin mr-2">⭮</span>
        ) : (
          <Image
            src="/images/google-logo.svg"
            width={18}
            height={18}
            alt="Google logo"
          />
        )}
        {isLoading
          ? "Connecting..."
          : mode === "sign-in"
            ? "Sign in with Google"
            : "Sign up with Google"}
      </Button>
      {authError && (
        <div className="mt-2 text-sm text-red-500">{authError}</div>
      )}
    </>
  );
}
