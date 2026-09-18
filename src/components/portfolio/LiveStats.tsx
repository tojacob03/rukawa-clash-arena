import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, useInView } from "framer-motion";
import { Swords, Target, Trophy } from "lucide-react";

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

interface StatsPayload {
  battlesAnalyzed30d: number;
  topFriendlyPlayer: { tag: string; name: string | null; count: number } | null;
  activeDossiers: number;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);
  const inView = useInView(nodeRef, { margin: "-50px" });

  useEffect(() => {
    if (!inView || !nodeRef.current || !Number.isFinite(value)) return;

    const from = prevRef.current;
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

const formatTag = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

const LiveStats = () => {
  const { data, isLoading, isError } = useQuery<StatsPayload>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const lastTop = useRef<StatsPayload["topFriendlyPlayer"]>(null);
  const lastDossiers = useRef(0);
  const lastBattles = useRef(0);

  if (data?.topFriendlyPlayer) lastTop.current = data.topFriendlyPlayer;
  if (typeof data?.activeDossiers === "number" && data.activeDossiers > 0) {
    lastDossiers.current = data.activeDossiers;
  }
  if (typeof data?.battlesAnalyzed30d === "number" && data.battlesAnalyzed30d > 0) {
    lastBattles.current = data.battlesAnalyzed30d;
  }

  const battles = lastBattles.current;
  const dossiers = lastDossiers.current;
  const topFriendlyPlayer = lastTop.current;

  // Reflects the real fetch state - never a decorative animation. "Live" only
  // shows once we've actually had a successful response.
  const connectionState: "connecting" | "live" | "offline" =
    isError && !data ? "offline" : data ? "live" : "connecting";

  const StatusIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 pb-3 mb-3 border-b border-border/30">
      <span className="relative flex h-1.5 w-1.5">
        {connectionState === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            connectionState === "live"
              ? "bg-green-400"
              : connectionState === "offline"
              ? "bg-destructive"
              : "bg-muted-foreground"
          }`}
        />
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        {connectionState === "live"
          ? "Live"
          : connectionState === "offline"
          ? "Reconnecting"
          : "Connecting"}
      </span>
    </div>
  );

  if (isError && !battles) return null;

  if ((isLoading || !data) && !battles) {
    return (
      <div className="w-full border-y border-border/40 bg-secondary/10 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-16 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-muted"></div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded"></div>
              <div className="h-5 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-y border-border/40 bg-secondary/10 py-4 mt-8 backdrop-blur-sm relative z-20">
      <div className="max-w-5xl mx-auto px-6">
        <StatusIndicator />
        <div className="flex flex-col sm:flex-row justify-center sm:justify-evenly items-center gap-6 sm:gap-8">
          {/* Stat 1: Raw Matches */}
          <div className="flex items-center gap-3.5 flex-1 justify-center sm:justify-start">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Swords className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Raw Matches Parsed (30d)
              </span>
              <span className="text-xl font-bold text-foreground leading-tight">
                <AnimatedNumber value={battles} />+
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-border/50"></div>

          {/* Stat 2: Weekly Friendly Grinder */}
          <div className="flex items-center gap-3.5 flex-1 justify-center sm:justify-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Most Practice Battles (14d)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground leading-tight">
                  {topFriendlyPlayer ? topFriendlyPlayer.name || formatTag(topFriendlyPlayer.tag) : "Aggregating…"}
                </span>
                {topFriendlyPlayer && (
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    ({topFriendlyPlayer.count.toLocaleString("en-US")} matches)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-border/50"></div>

          {/* Stat 3: Active Pro Dossiers */}
          <div className="flex items-center gap-3.5 flex-1 justify-center sm:justify-end">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Active Pro Dossiers
              </span>
              <span className="text-xl font-bold text-foreground leading-tight">
                <AnimatedNumber value={dossiers} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
