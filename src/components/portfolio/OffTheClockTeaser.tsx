import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BJJ, READING } from "@/data/offTheClock";

// One clickable row, not another section: the details live on /off-the-clock.
const OffTheClockTeaser = () => (
  <div className="px-5 sm:px-6">
    <Link
      to="/off-the-clock"
      className="group mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 px-6 py-6 transition-colors hover:border-clash-gold/40 sm:flex-row sm:items-center sm:justify-between sm:px-8"
    >
      <div>
        <p className="label-caps text-clash-gold">Off the clock</p>
        <p className="mt-2 text-lg text-foreground sm:text-xl">
          No-Gi grappling since {BJJ.since.split(" ")[1]} · espresso · {READING.author} · a
          different fragrance every morning
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-clash-gold">
        The person behind the work
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  </div>
);

export default OffTheClockTeaser;
