"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User,
  KeyRound,
  BarChart3,
  Loader2,
  CheckCircle,
  Cpu,
  DollarSign,
  Zap,
  Calendar,
} from "lucide-react";
import { MODEL_INFO } from "@/lib/constants";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    })
    .then((res) => res.data);

export default function ProfilePage() {
  const { data: user } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const { data: usage } = useSWR("/api/auth/usage", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    setPwdLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwdError(data.error || "Failed to change password");
        setPwdLoading(false);
        return;
      }

      setPwdSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwdError("Network error. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  }

  function formatCost(value: number): string {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }

  function formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-scripture font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and view AI usage
        </p>
      </div>

      {/* Account Info */}
      <Card className="border-border/50 bg-card/80 animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-gold" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border/50 bg-card/80 animate-slide-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gold" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {pwdError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {pwdSuccess}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="profile-current-pwd" className="text-sm font-medium text-foreground/80">
                Current Password
              </label>
              <Input
                id="profile-current-pwd"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-new-pwd" className="text-sm font-medium text-foreground/80">
                New Password
              </label>
              <Input
                id="profile-new-pwd"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-confirm-pwd" className="text-sm font-medium text-foreground/80">
                Confirm New Password
              </label>
              <Input
                id="profile-confirm-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="bg-gold hover:bg-gold/90 text-black font-medium"
              disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {pwdLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI Usage Dashboard */}
      <Card className="border-border/50 bg-card/80 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" />
            AI Usage
          </CardTitle>
          <CardDescription>Token consumption and estimated spend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {usage ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Zap className="h-3.5 w-3.5" />
                    Total Tokens
                  </div>
                  <p className="text-2xl font-semibold">{formatTokens(usage.summary.totalTokens)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    Estimated Spend
                  </div>
                  <p className="text-2xl font-semibold">{formatCost(usage.summary.totalCostUsd)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Cpu className="h-3.5 w-3.5" />
                    Total Requests
                  </div>
                  <p className="text-2xl font-semibold">{usage.summary.totalRequests}</p>
                </div>
              </div>

              {/* Per-Model Breakdown */}
              {usage.byModel.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Usage by Model</h3>
                  <div className="space-y-2">
                    {usage.byModel.map((model: { modelId: string; promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number; requests: number }) => {
                      const info = MODEL_INFO[model.modelId];
                      return (
                        <div
                          key={model.modelId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {info?.label || model.modelId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {info?.provider || "Unknown"} · {model.requests} request{model.requests !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-sm font-medium">{formatTokens(model.totalTokens)}</p>
                            <p className="text-xs text-muted-foreground">{formatCost(model.costUsd)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {usage.recent.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto hide-scrollbar">
                    {usage.recent.map((entry: { id: string; modelId: string; totalTokens: number; costUsd: number; createdAt: string }) => {
                      const info = MODEL_INFO[entry.modelId];
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-muted-foreground">
                              {info?.label || entry.modelId}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-4 text-xs text-muted-foreground">
                            <span>{formatTokens(entry.totalTokens)} tokens</span>
                            <span>{formatCost(entry.costUsd)}</span>
                            <span className="hidden sm:inline">{formatDate(entry.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {usage.summary.totalRequests === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No AI usage yet. Start a study conversation to see your usage here.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading usage data...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
