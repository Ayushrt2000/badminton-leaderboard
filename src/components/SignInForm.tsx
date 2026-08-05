"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
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

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);

  function buildCallbackUrl() {
    const callback = new URL(`${window.location.origin}/auth/callback`);
    if (next) callback.searchParams.set("next", next);
    return callback.toString();
  }

  async function handleOAuth(provider: "google") {
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildCallbackUrl(),
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="font-display text-2xl text-accent">Check your email</p>
          <p className="mt-2 text-sm text-white/60">
            We sent a sign-in link to <span className="text-white">{email}</span>. Open it on
            this device to finish signing in.
          </p>
        </CardContent>
      </Card>
    );
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
            onClick={() => handleOAuth("google")}
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-white/30">or use email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {error && <p className="mb-3 text-sm text-primary">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending link..." : "Send magic link"}
          </Button>
          <p className="text-center text-xs text-white/35">
            No password needed. We&apos;ll email you a one-tap sign-in link, then grab your name
            and community.
          </p>
        </form>

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
