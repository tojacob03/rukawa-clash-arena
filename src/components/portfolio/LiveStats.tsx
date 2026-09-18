import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, useInView } from "framer-motion";
import { ShieldCheck, Swords, Trophy } from "lucide-react";

// The public Supabase Edge Function URL
const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

interface StatsPayload {
  battlesAnalyzed30d: number;
  topFriendlyPlayer: { tag: string; count: number } | null;
  lastValidDuel: { player1: string; player2: string; time: string } | null;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);
  const inView = useInView(nodeRef, { margin: "-50px" });

  useEffect(() => {
    if (!inView || !nodeRef.current || !Number.isFinite(value)) return;

    const from = prevRef.current;
    // First reveal counts up from zero smoothly. Later updates tick quickly from the old value.
    const controls = animate(from, value, {
      duration: from === 0 ? 2.5 : 0.8,
      ease: "easeOut",
      onUpdate(v) {
        if (nodeRef.current) {
          nodeRef.current.textContent = Math.round(v).toLocaleString("en-US");
        }
      },
    });

    prevRef.current = value;
    return () => controls.stop();
  }, [value, inView]);

  return <span ref={nodeRef}>0</span>;
};

const formatRelative = (timestamp: string) => {
  const target = new Date(timestamp).getTime();
  if (Number.isNaN(target)) return null;

  const diffSecs = Math.max(0, Math.floor((Date.now() - target) / 1000));
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
};

const LiveRelativeTime = ({ timestamp }: { timestamp?: string }) => {
  const [timeStr, setTimeStr] = useState(() =>
    timestamp ? (formatRelative(timestamp) ?? "Tracking...") : "Tracking...",
  );

  useEffect(() => {
    if (!timestamp) {
      setTimeStr("Tracking...");
      return;
    }

    const updateTimer = () => setTimeStr(formatRelative(timestamp) ?? "Tracking...");

    // Update immediately, then trigger every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className="text-sm font-semibold text-foreground">{timeStr}</span>;
};

const formatTag = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

const LiveStats = () => {
  const { data, isLoading, isError } = useQuery<StatsPayload>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
    // Background polling every 15 seconds to keep the dashboard feeling live
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
    retry: 2,
  });

  // State caching: Keeps the last real values so the ticker never flickers back to "N/A"
  // during a background refresh or if the backend temporarily returns null.
  const lastTop = useRef<StatsPayload["topFriendlyPlayer"]>(null);
  const lastDuel = useRef<StatsPayload["lastValidDuel"]>(null);
  const lastBattles = useRef(0);

  if (data?.topFriendlyPlayer) lastTop.current = data.topFriendlyPlayer;
  if (data?.lastValidDuel) lastDuel.current = data.lastValidDuel;
  if (typeof data?.battlesAnalyzed30d === "number" && data.battlesAnalyzed30d > 0) {
    lastBattles.current = data.battlesAnalyzed30d;
  }

  const battles = lastBattles.current;
  const topFriendlyPlayer = lastTop.current;
  const lastValidDuel = lastDuel.current;

  // Silent fallback: completely hide the component if there's a fatal error and no cached data
  if (isError && !battles) return null;

  if ((isLoading || !data) && !battles) {
    return (
      <div className="w-full border-y border-border/40 bg-secondary/10 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-16 animate-pulse">
          {/* Skeleton Item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20"></div>
            <div className="space-y-2">
              <div className="h-2 w-28 bg-muted rounded"></div>
              <div className="h-5 w-20 bg-muted rounded"></div>
            </div>
          </div>
          {/* Skeleton Item 2 */}
          <div className="flex items-center gap-3 hidden sm:flex">
            <div className="w-10 h-10 rounded-lg bg-primary/20"></div>
            <div className="space-y-2">
              <div className="h-2 w-32 bg-muted rounded"></div>
              <div className="h-5 w-24 bg-muted rounded"></div>
            </div>
          </div>
          {/* Skeleton Item 3 */}
          <div className="flex items-center gap-3 hidden md:flex">
            <div className="w-10 h-10 rounded-lg bg-primary/20"></div>
            <div className="space-y-2">
              <div className="h-2 w-36 bg-muted rounded"></div>
              <div className="h-5 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-y border-border/40 bg-secondary/10 py-4 mt-8 backdrop-blur-sm relative z-20">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-center md:justify-evenly items-center gap-6 md:gap-4">
        {/* Stat 1: Raw Matches Parsed */}
        <div className="flex items-center gap-3.5 flex-1 justify-center md:justify-start">
          <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Swords className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Raw Matches Parsed (30d)
            </span>
            <span className="text-xl font-bold text-foreground leading-tight tracking-tight">
              <AnimatedNumber value={battles} />+
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-border/50"></div>

        {/* Stat 2: Weekly Friendly Grinder */}
        <div className="flex items-center gap-3.5 flex-1 justify-center">
          <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Weekly Friendly Grinder
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground leading-tight font-mono tracking-tight">
                {topFriendlyPlayer ? formatTag(topFriendlyPlayer.tag) : "Aggregating…"}
              </span>
              {topFriendlyPlayer && (
                <span className="text-xs text-muted-foreground font-medium">
                  ({topFriendlyPlayer.count.toLocaleString("en-US")} matches)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-border/50"></div>

        {/* Stat 3: Last Valid Duel Detected (Ticking Timer) */}
        <div className="flex items-center gap-3.5 flex-1 justify-center md:justify-end">
          <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden max-w-full">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Last Valid Duel Detected
            </span>
            <div className="flex flex-col mt-0.5">
              <span className="text-sm font-bold text-foreground leading-tight truncate font-mono">
                {lastValidDuel
                  ? `${formatTag(lastValidDuel.player1)} vs ${formatTag(lastValidDuel.player2)}`
                  : "Awaiting Data..."}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    lastValidDuel
                      ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : "bg-muted-foreground/50"
                  }`}
                />
                <LiveRelativeTime timestamp={lastValidDuel?.time} />
                <span className="text-[9px] text-primary/80 uppercase ml-1 border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-bold">
                  No Repeats
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
