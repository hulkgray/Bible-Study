"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md animate-scale-in">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-red-400">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
              Please request a new one.
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/forgot-password"
              className="text-sm text-gold hover:text-gold/80 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Request new reset link
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details).flat()[0];
          setError(firstError as string || "Validation failed");
        } else {
          setError(data.error || "Reset failed");
        }
        setLoading(false);
        return;
      }

      router.push("/login?reset=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      {/* Brand */}
      <div className="text-center mb-8">
        <span className="text-gold text-4xl font-scripture">✦</span>
        <h1 className="text-2xl font-scripture font-semibold mt-2">Bible Study</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your new password
        </p>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gold" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="reset-password" className="text-sm font-medium text-foreground/80">
                New Password
              </label>
              <Input
                id="reset-password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reset-confirm" className="text-sm font-medium text-foreground/80">
                Confirm Password
              </label>
              <Input
                id="reset-confirm"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Resetting...</>
              ) : (
                "Reset Password"
              )}
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-gold flex items-center gap-1 justify-center transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Suspense fallback={
        <div className="w-full max-w-md flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
