import { motion } from "framer-motion";
import SectionIntro from "@/components/portfolio/SectionIntro";

// Result first, then the event - one line each, no icon tiles or repeated
// rank pills.
const results = [
  { result: "Top 2, 3, 3 & 4", event: "CRL Monthly Finals", context: "Players I prepared · CRL 2025 & 2026" },
  { result: "Top 6", event: "Supremacy League Copa América", context: "Selección Colombia · 2025" },
  { result: "Champion", event: "Amazon University Esports Masters", context: "Season 4 · Germany" },
  { result: "4th place", event: "GGtoor x Haneki Cup", context: "Season 1" },
];

const AchievementsSection = () => (
  <section id="achievements" className="scroll-mt-14 px-5 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto max-w-7xl">
      <SectionIntro eyebrow="Results" title="What the work has produced." />
      <ol className="mt-12 border-t border-border/60">
        {results.map((r, i) => (
          <motion.li
            key={r.event}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-1 border-b border-border/60 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6"
          >
            <span className="text-3xl font-semibold tracking-tight text-clash-gold sm:col-span-4 sm:text-4xl">
              {r.result}
            </span>
            <span className="text-lg font-medium text-foreground sm:col-span-5">{r.event}</span>
            <span className="text-sm text-muted-foreground sm:col-span-3 sm:text-right">{r.context}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  </section>
);

export default AchievementsSection;
