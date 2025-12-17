"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function PlanUsageCard() {
  const { data: metrics, isLoading } = trpc.plan.getMetrics.useQuery();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading || !metrics) return null;

  const analysisPercentage = metrics.analysisUsage.percentage || 0;
  const aiPercentage = metrics.aiGenerationUsage.percentage || 0;
  const isPro = metrics.planType === "pro";
  const isEnterprise = metrics.planType === "enterprise";

  const showWarning = analysisPercentage > 80 || aiPercentage > 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {isPro || isEnterprise ? (
                  <>
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {metrics.planType.charAt(0).toUpperCase() + metrics.planType.slice(1)} Plan
                  </>
                ) : (
                  "Free Plan"
                )}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                {metrics.currentMonth}
              </p>
            </div>
            {!isEnterprise && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                onClick={() => setShowUpgrade(!showUpgrade)}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>

          {showWarning && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-gap-2 gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Usage limits approaching. Consider upgrading for more analyses and generations.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-300">
                  Analyses
                </label>
                <span className="text-xs text-neutral-400">
                  {metrics.analysisUsage.used} / {metrics.analysisUsage.limit === -1 ? "Unlimited" : metrics.analysisUsage.limit}
                </span>
              </div>
              {metrics.analysisUsage.percentage !== null && (
                <Progress
                  value={Math.min(100, metrics.analysisUsage.percentage)}
                  className="h-2 bg-neutral-800"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-300">
                  AI Generations
                </label>
                <span className="text-xs text-neutral-400">
                  {metrics.aiGenerationUsage.used} / {metrics.aiGenerationUsage.limit === -1 ? "Unlimited" : metrics.aiGenerationUsage.limit}
                </span>
              </div>
              {metrics.aiGenerationUsage.percentage !== null && (
                <Progress
                  value={Math.min(100, metrics.aiGenerationUsage.percentage)}
                  className="h-2 bg-neutral-800"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-300">
                  Saved Job Descriptions
                </label>
                <span className="text-xs text-neutral-400">
                  {metrics.jdsSaved.used} / {metrics.jdsSaved.limit === -1 ? "Unlimited" : metrics.jdsSaved.limit}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-neutral-500 space-y-1">
            <p>✓ {metrics.exportModes.length === 1 ? "PDF" : "Multiple format"} export</p>
            <p>✓ {isPro || isEnterprise ? "Priority support" : "Email support"}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
