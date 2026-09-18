import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, useInView } from "framer-motion";
import { Activity, Swords, Users } from "lucide-react";

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

interface StatsPayload {
  battlesAnalyzed30d: number;
  playersTracked: number;
  // Unser neues Datenfeld aus dem Backend
  lastBattleIngestedAt: string;
}

// 1. Zählt die absoluten Zahlen einmalig hoch
const AnimatedNumber = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView && nodeRef.current) {
      const controls = animate(0, value, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(v) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(v).toLocaleString("en-US");
          }
        },
      });
      return () => controls.stop();
    }
  }, [value, inView]);

  return <span ref={nodeRef}>0</span>;
};

// 2. NEU: Die tickende Live-Uhr! Aktualisiert sich jede einzelne Sekunde.
const LiveRelativeTime = ({ timestamp }: { timestamp?: string }) => {
  const [timeStr, setTimeStr] = useState("Syncing...");

  useEffect(() => {
    if (!timestamp) return;

    const updateTimer = () => {
      const diffMs = new Date().getTime() - new Date(timestamp).getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));

      if (diffSecs < 60) {
        setTimeStr(`${diffSecs}s ago`);
      } else {
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        setTimeStr(`${mins}m ${secs}s ago`);
      }
    };

    updateTimer(); // Sofort updaten beim Mount
    const interval = setInterval(updateTimer, 1000); // Jede Sekunde ticken lassen

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className="text-base font-semibold text-foreground leading-tight">{timeStr}</span>;
};

const LiveStats = () => {
  const { data, isLoading, isError } = useQuery<StatsPayload>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL);
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
    // Holt alle 15 Sekunden lautlos im Hintergrund die neuen Daten
    refetchInterval: 15 * 1000,
    retry: 1,
  });

  if (isError) return null;

  if (isLoading || !data) {
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
    <div className="w-full border-y border-border/40 bg-secondary/10 py-4 mt-8 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-center sm:justify-evenly items-center gap-6 sm:gap-8">
        {/* Stat 1: Battles Analyzed */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Swords className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Battles Analyzed (30d)
            </span>
            <span className="text-xl font-bold text-foreground leading-tight">
              <AnimatedNumber value={data.battlesAnalyzed30d} />+
            </span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-border/50"></div>

        {/* Stat 2: Pro Accounts Monitored (Umbenannt) */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Pro Accounts Monitored
            </span>
            <span className="text-xl font-bold text-foreground leading-tight">
              <AnimatedNumber value={data.playersTracked} />
            </span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-border/50"></div>

        {/* Stat 3: Last Battle Ingested (Jetzt mit tickendem Timer) */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Last Battle Ingested
            </span>
            <div className="flex items-center gap-2 mt-0.5 min-w-[120px]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <LiveRelativeTime timestamp={data.lastBattleIngestedAt} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
