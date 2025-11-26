
"use client";

import { useState, useEffect } from "react";
import { parseISO, formatDistanceStrict, format } from "date-fns";
import type { TriggerStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";

type TimeCountdownProps = {
  nextRun: string;
  status: TriggerStatus;
};

const padZero = (num: number) => num.toString().padStart(2, '0');

const formatDuration = (seconds: number) => {
  if (seconds < 0) seconds = 0;

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${padZero(days)}d ${padZero(hours)}h ${padZero(minutes)}m ${padZero(secs)}s`;
};

export function TimeCountdown({ nextRun, status }: TimeCountdownProps) {
  const [countdown, setCountdown] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (status !== 'active') {
      const nextRunDate = parseISO(nextRun);
      setCountdown(formatDistanceStrict(nextRunDate, new Date(), { addSuffix: true }));
      setIsRunning(false);
      return;
    }

    const updateCountdown = () => {
      const nextRunDate = parseISO(nextRun);
      const now = new Date();
      const diffInSeconds = (nextRunDate.getTime() - now.getTime()) / 1000;

      if (diffInSeconds <= 0) {
        setCountdown("Running...");
        setIsRunning(true);
      } else {
        setCountdown(formatDuration(diffInSeconds));
        setIsRunning(false);
      }
    };

    // Initial call
    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [nextRun, status]);

  if (!isClient) {
    return (
      <div className="space-y-1">
        <div className="h-4 w-32 rounded bg-muted-foreground/20 animate-pulse" />
        <div className="h-3 w-24 rounded bg-muted-foreground/20 animate-pulse" />
      </div>
    )
  }

  if (status !== "active") {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground italic">
          {status === "paused" ? "Paused" : "Not scheduled"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {isRunning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        <span className={isRunning ? "text-primary font-medium" : ""}>{countdown}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {format(parseISO(nextRun), "MMM d, hh:mm a")}
      </span>
    </div>
  );
}
