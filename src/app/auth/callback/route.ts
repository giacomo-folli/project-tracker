import { createClientWithCookies } from "../../../../supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description);
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(error_description || error)}`,
        requestUrl.origin,
      ),
    );
  }

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = await createClientWithCookies(cookieStore);
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL(
            `/sign-in?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin,
          ),
        );
      }
    } catch (err) {
      console.error("Unexpected error during auth callback:", err);
      return NextResponse.redirect(
        new URL(
          `/sign-in?error=${encodeURIComponent("Authentication failed")}`,
          requestUrl.origin,
        ),
      );
    }
  } else if (!error) {
    // No code and no error means something went wrong
    console.error("No code or error returned from OAuth provider");
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("Authentication failed")}`,
        requestUrl.origin,
      ),
    );
  }

  // URL to redirect to after sign in process completes
  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
