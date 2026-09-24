import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// GitHub contributions, cached once a day by the database job
// github.refresh() (supabase/migrations/20260924094756_github_contributions.sql).
interface ContributionPayload {
  login: string;
  total: number;
  days: [date: string, count: number][];
  built_at: string;
}

// The function isn't part of the generated Supabase types, so call it untyped.
type UntypedRpc = (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;

const WEEKS = 26;

const useContributions = () =>
  useQuery({
    queryKey: ["github-contributions"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as UntypedRpc).call(supabase, "github_contributions");
      if (error) throw new Error(error.message);
      return data as ContributionPayload | null;
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const ContributionGraph = () => {
  const { data } = useContributions();
  const [hover, setHover] = useState<[string, number] | null>(null);

  const view = useMemo(() => {
    if (!data?.days?.length) return null;
    // GitHub's calendar ends with the current (partial) week, Sunday-first.
    // Keep the last WEEKS full columns.
    const days = data.days;
    const lastWeekStart = days.length - 1 - new Date(`${days[days.length - 1][0]}T12:00:00Z`).getUTCDay();
    const start = Math.max(0, lastWeekStart - (WEEKS - 1) * 7);
    const slice = days.slice(start);
    const columns: ([string, number] | null)[][] = [];
    for (let i = 0; i < slice.length; i += 7) {
      const col: ([string, number] | null)[] = slice.slice(i, i + 7);
      while (col.length < 7) col.push(null);
      columns.push(col);
    }
    // Colour steps from the spread of active days, so a few huge days don't
    // flatten everything else into the lowest shade.
    const active = slice.map((d) => d[1]).filter((c) => c > 0).sort((a, b) => a - b);
    const q = (p: number) => active[Math.min(active.length - 1, Math.floor(p * active.length))] ?? 1;
    const steps = [q(0.25), q(0.5), q(0.75)];
    const total = slice.reduce((n, d) => n + d[1], 0);
    const activeDays = active.length;
    return { columns, steps, total, activeDays };
  }, [data]);

  if (!view) return null;

  const level = (c: number) => (c === 0 ? 0 : c <= view.steps[0] ? 1 : c <= view.steps[1] ? 2 : c <= view.steps[2] ? 3 : 4);
  const shade = ["hsl(var(--secondary))", "hsl(45 100% 60% / 0.3)", "hsl(45 100% 60% / 0.55)", "hsl(45 100% 60% / 0.8)", "hsl(45 100% 60%)"];

  return (
    <div className="mt-6 border-t border-border/60 pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="label-caps text-muted-foreground">Shipping, week by week</p>
        <a
          href={`https://github.com/${data?.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          GitHub
        </a>
      </div>

      <div
        className="mt-3 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${view.columns.length}, minmax(0, 1fr))` }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${view.total} GitHub contributions on ${view.activeDays} days in the last ${WEEKS} weeks`}
      >
        {view.columns.map((col, x) => (
          <div key={x} className="grid gap-[3px]">
            {col.map((day, y) =>
              day ? (
                <motion.div
                  key={day[0]}
                  className="aspect-square rounded-[2px]"
                  style={{ background: shade[level(day[1])] }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: x * 0.015 + y * 0.01 }}
                  onMouseEnter={() => setHover(day)}
                />
              ) : (
                <div key={`empty-${y}`} className="aspect-square" />
              ),
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 h-4 text-xs text-muted-foreground" aria-live="polite">
        {hover
          ? `${hover[1]} contribution${hover[1] === 1 ? "" : "s"} on ${fmtDay(hover[0])}`
          : `${view.total.toLocaleString("en-US")} contributions on ${view.activeDays} days in the last ${WEEKS} weeks`}
      </p>
    </div>
  );
};

export default ContributionGraph;
