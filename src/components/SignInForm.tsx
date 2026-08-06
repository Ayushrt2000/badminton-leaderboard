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
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.037 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.325-3.036c.842-1.014 1.409-2.42 1.253-3.83-1.213.052-2.674.805-3.545 1.818-.78.898-1.462 2.336-1.28 3.714 1.345.104 2.72-.688 3.572-1.702" />
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
