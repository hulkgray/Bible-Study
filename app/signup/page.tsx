"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle field-level errors from Zod
        if (data.details) {
          const firstError = Object.values(data.details).flat()[0];
          setError(firstError as string || "Validation failed");
        } else {
          setError(data.error || "Signup failed");
        }
        setLoading(false);
        return;
      }

      // Redirect to login with success message
      router.push("/login?registered=true");
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
            Create a free account to save your study progress
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-gold" />
              Create Account
            </CardTitle>
            <CardDescription>
              Sign up to save bookmarks, notes, and AI conversations
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
                <label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">
                  Name
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading || !name || !email || !password}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-gold hover:text-gold/80 underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
