"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details).flat()[0];
          setError(firstError as string || "Validation failed");
        } else {
          setError(data.error || "Something went wrong");
        }
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="text-gold text-4xl font-scripture">✦</span>
          <h1 className="text-2xl font-scripture font-semibold mt-2">Bible Study</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reset your password
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          {sent ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Check Your Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account with <strong className="text-foreground">{email}</strong> exists,
                  we&apos;ve sent a password reset link. Check your inbox and spam folder.
                </p>
                <p className="text-xs text-muted-foreground">
                  The link will expire in 1 hour.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href="/login"
                  className="text-sm text-gold hover:text-gold/80 flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold" />
                  Forgot Password
                </CardTitle>
                <CardDescription>
                  Enter your email and we&apos;ll send you a reset link
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
                    <label htmlFor="forgot-email" className="text-sm font-medium text-foreground/80">
                      Email
                    </label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                    ) : (
                      "Send Reset Link"
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
