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
  const user = userQuery.data;

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
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
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
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Free Plan</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Limited AI credits and features
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800">
                    <span className="h-2 w-2 rounded-full bg-green-400"></span>
                    <span className="text-xs text-neutral-300">Active</span>
                  </div>
                </div>

                <div className="text-sm text-neutral-400 mt-3">
                  AI Credits: <span className="font-semibold">4 / 10</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full"
                    style={{ width: "40%" }}
                  ></div>
                </div>
              </div>

              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
                disabled
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro (Coming Soon)
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
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
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

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-900 transition-colors">
                <div>
                  <p className="text-sm font-medium">Dark Theme</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Always enabled
                  </p>
                </div>
                <div className="text-xs text-green-400 font-semibold">
                  ✓ Active
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ACCOUNT SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
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
                className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
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
