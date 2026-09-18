import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, useInView } from "framer-motion";
import { Activity, Swords, Users } from "lucide-react";

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

interface StatsPayload {
  battlesAnalyzed30d: number;
  playersTracked: number;
  metaLastSyncedAt: string;
}

// Hilfskomponente: Zählt eine Zahl butterweich von 0 auf den Zielwert hoch
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

const LiveStats = () => {
  const { data, isLoading, isError } = useQuery<StatsPayload>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL);
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
    // Refetch alle 5 Minuten für das "lebendige" Gefühl
    refetchInterval: 5 * 60 * 1000, 
    // Wenn das Backend mal offline ist, versuchen wir es nicht aggressiv weiter
    retry: 1, 
  });

  // EXPLIZITER FALLBACK: Wenn ein Fehler auftritt, blenden wir die Leiste komplett aus.
  // Ein Portfolio-Besucher sieht so niemals ein "undefined" oder eine Error-Message.
  if (isError) return null;

  // SKELETON LOADER: Wird angezeigt, solange TanStack Query die initialen Daten lädt
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

  // Formatierung für das "Last Sync" Datum
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "Syncing...";
    const diffMins = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diffMins < 5) return "Live Status";
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)} hours ago`;
  };

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

        {/* Trennlinie auf Desktop */}
        <div className="hidden sm:block w-px h-10 bg-border/50"></div>

        {/* Stat 2: Players Tracked */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Tier-1 Players Tracked
            </span>
            <span className="text-xl font-bold text-foreground leading-tight">
              <AnimatedNumber value={data.playersTracked} />
            </span>
          </div>
        </div>

        {/* Trennlinie auf Desktop */}
        <div className="hidden sm:block w-px h-10 bg-border/50"></div>

        {/* Stat 3: Engine Status */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Meta Last Synced
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-base font-semibold text-foreground leading-tight">
                {getRelativeTime(data.metaLastSyncedAt)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveStats;
