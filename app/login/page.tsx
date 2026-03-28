"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const justSignedUp = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Redirect to returnUrl or home
      window.location.href = returnUrl;
    } catch {
      setError("Network error. Please try again.");
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
            Sign in to access your study tools
          </p>
        </div>

        {justSignedUp && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            Account created successfully! Please sign in.
          </div>
        )}

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="h-4 w-4 text-gold" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your email and password to continue
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
                <label htmlFor="login-email" className="text-sm font-medium text-foreground/80">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground/80">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...</>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-gold hover:text-gold/80 underline underline-offset-4">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
