"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, LogOut, Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);

  const userQuery = trpc.auth.me.useQuery();
  const creditsQuery = trpc.billing.getUserCredits.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30s for real-time updates
  });
  const metricsQuery = trpc.plan.getMetrics.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const user = userQuery.data;
  const credits = creditsQuery.data?.credits || 0;
  const metrics = metricsQuery.data;

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setLoading(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setDeleteAccountConfirmOpen(true);
  };

  const handleDeleteAccountConfirm = async () => {
    toast.info("Delete account feature coming soon");
    setDeleteAccountConfirmOpen(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Settings</h1>
        </motion.header>

        {/* PROFILE SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-black border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-neutral-400">Name</Label>
                <Input
                  type="text"
                  value={user?.name || ""}
                  disabled
                  className="mt-2 bg-neutral-900 border-neutral-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs text-neutral-400">Email</Label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 bg-neutral-900 border-neutral-800 text-white"
                />
              </div>

              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-300"
                disabled
              >
                Edit Profile (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* SUBSCRIPTION SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-black border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Subscription & Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      {metrics?.planType === "pro" ? "Pro Plan" : metrics?.planType === "enterprise" ? "Enterprise Plan" : "Free Plan"}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {metrics?.planType === "pro" || metrics?.planType === "enterprise"
                        ? "Premium features enabled"
                        : "Limited AI credits and features"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs text-neutral-300">Active</span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex items-center justify-between text-sm text-neutral-400 mb-1">
                      <span>Download Credits</span>
                      <span className="font-semibold text-white">{credits}</span>
                    </div>
                    {credits === 0 && (
                      <p className="text-xs text-red-400 mt-1">⚠ No credits available</p>
                    )}
                  </div>

                  {metrics && (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-sm text-neutral-400 mb-1">
                          <span>Analyses Used</span>
                          <span className="font-semibold text-white">
                            {metrics.analysisUsage.used} / {metrics.analysisUsage.limit === -1 ? "Unlimited" : metrics.analysisUsage.limit}
                          </span>
                        </div>
                        {metrics.analysisUsage.percentage !== null && (
                          <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                metrics.analysisUsage.percentage > 80 ? "bg-red-500" : "bg-white"
                              }`}
                              style={{ width: `${Math.min(100, metrics.analysisUsage.percentage)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm text-neutral-400 mb-1">
                          <span>AI Generations Used</span>
                          <span className="font-semibold text-white">
                            {metrics.aiGenerationUsage.used} / {metrics.aiGenerationUsage.limit === -1 ? "Unlimited" : metrics.aiGenerationUsage.limit}
                          </span>
                        </div>
                        {metrics.aiGenerationUsage.percentage !== null && (
                          <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                metrics.aiGenerationUsage.percentage > 80 ? "bg-red-500" : "bg-white"
                              }`}
                              style={{ width: `${Math.min(100, metrics.aiGenerationUsage.percentage)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg cursor-pointer"
                onClick={() => router.push("/billing")}
              >
                <Crown className="h-4 w-4 mr-2" />
                {credits === 0 ? "Get Credits" : "Manage Subscription"}
              </Button>

              <Button
                variant="outline"
                className="w-full border-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                onClick={() => router.push("/billing/history")}
              >
                View Billing History
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* PREFERENCES SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-black border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-900 transition-colors">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Get updates on analyses and suggestions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-neutral-400"
                >
                  (Coming Soon)
                </Button>
              </div>

              <Separator className="bg-neutral-800" />

            </CardContent>
          </Card>
        </motion.section>

        {/* ACCOUNT SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-black border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-neutral-700 text-neutral-300 rounded-lg"
                disabled
              >
                Change Password (Coming Soon)
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-700 text-red-400 hover:bg-red-900/10 rounded-lg"
                onClick={handleDeleteAccountClick}
              >
                Delete Account
              </Button>

              <Button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* INFO TEXT */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center text-xs text-neutral-500 pt-4"
        >
          <p>
            Need help? Contact us at{" "}
            <a href="mailto:support@example.com" className="text-neutral-300 hover:underline">
              support@example.com
            </a>
          </p>
        </motion.div>
      </div>

      <ConfirmationDialog
        open={deleteAccountConfirmOpen}
        onOpenChange={setDeleteAccountConfirmOpen}
        title="Delete Account?"
        description="This action cannot be undone. All your data, resumes, and analyses will be permanently deleted."
        actionLabel="Delete Account"
        cancelLabel="Cancel"
        variant="destructive"
        isPending={false}
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteAccountConfirmOpen(false)}
      />
    </main>
  );
}
