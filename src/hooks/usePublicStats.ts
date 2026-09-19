import { useQuery } from "@tanstack/react-query";

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

export interface PublicStatsPayload {
  battlesAnalyzed30d: number;
  topFriendlyPlayer: { tag: string; name: string | null; count: number } | null;
  activeDossiers: number;
  topMetaDeck: {
    cards: { id: number; name: string; icon: string | null }[];
    winRate: number;
    usageRate: number;
    games: number;
    timeWindow: string;
    updatedAt: string;
  } | null;
}

/**
 * Single shared source for the public-stats edge function. LiveStats and
 * MetaPulse both use this hook with the same query key, so TanStack Query
 * dedupes them into one network request instead of two.
 */
export const usePublicStats = () =>
  useQuery<PublicStatsPayload>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
    // Matches the edge function's Cache-Control: max-age=60 - polling faster
    // than the cache refreshes just adds requests without new data.
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
    retry: 2,
    placeholderData: (prev) => prev,
  });
