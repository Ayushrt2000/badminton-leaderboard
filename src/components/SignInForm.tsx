"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.75l4-3.11Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.07-1.26 2.79-.9.78-1.98 1.23-3.15 1.14-.09-1.14.36-2.13 1.2-2.94.87-.84 2.01-1.29 3.21-1.29zm3.09 16.86c-.42.99-.93 1.92-1.56 2.79-.87 1.2-1.59 2.04-2.16 2.52-.87.78-1.8 1.17-2.79 1.2-.72.03-1.59-.21-2.61-.72-1.02-.51-1.95-.75-2.79-.72-.87.03-1.77.27-2.7.72-.93.45-1.68.69-2.25.72-.96.06-1.86-.36-2.7-1.26-.6-.63-1.32-1.53-2.16-2.7-.9-1.26-1.65-2.73-2.25-4.41-.63-1.83-.96-3.6-.96-5.31 0-1.95.42-3.63 1.26-5.04.66-1.14 1.53-2.04 2.61-2.7 1.08-.66 2.25-1.02 3.51-1.02.75 0 1.71.27 2.85.78 1.14.51 1.86.78 2.19.78.24 0 1.05-.3 2.4-.9 1.32-.54 2.43-.75 3.33-.63 2.46.21 4.32 1.17 5.55 2.94-2.19 1.35-3.27 3.21-3.27 5.61 0 1.86.66 3.42 1.98 4.62.6.57 1.26.99 1.98 1.29-.15.42-.3.81-.48 1.17z" />
    </svg>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  function buildCallbackUrl() {
    const callback = new URL(`${window.location.origin}/auth/callback`);
    if (next) callback.searchParams.set("next", next);
    return callback.toString();
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: buildCallbackUrl() },
    });
    if (error) {
      setOauthLoading(null);
      setError(error.message);
    }
    // On success the browser is redirected away to the provider, so there's
    // nothing else to do here.
  }

  async function handleSkip() {
    setSkipping(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    setSkipping(false);

    if (error) {
      setError(
        error.message.includes("disabled")
          ? "Anonymous sign-ins are off for this project. Enable them in Supabase: Authentication → Sign In / Providers → Anonymous Sign-Ins."
          : error.message
      );
      return;
    }

    router.push(next ? `/complete-profile?next=${encodeURIComponent(next)}` : "/complete-profile");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth("apple")}
          >
            <AppleIcon />
            {oauthLoading === "apple" ? "Redirecting..." : "Continue with Apple"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth("google")}
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-primary">{error}</p>}

        <div className="mt-5 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping}
            className="text-xs font-semibold text-white/40 underline decoration-dotted hover:text-white/70 disabled:opacity-50"
          >
            {skipping ? "Skipping sign-in..." : "Skip for now (testing only, no email)"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
