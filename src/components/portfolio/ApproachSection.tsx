import { motion } from "framer-motion";
import SectionIntro from "@/components/portfolio/SectionIntro";
import ContributionGraph from "@/components/portfolio/ContributionGraph";

const EASE = [0.16, 1, 0.3, 1] as const;

// Replaces the former About, Method and Stack sections, which told the same
// story three times.
const METHOD = [
  {
    title: "Battle-log profiling",
    body: "Official API ingest across main and alt tags, stored battles, season and mode filters.",
  },
  {
    title: "Duel & Game 1 models",
    body: "Detect CRL and friendly duels and read first-game deck habits in Bo3 and Bo5.",
  },
  {
    title: "Remaining-deck support",
    body: "Score what a player still has after burned cards - mid-set, under time pressure.",
  },
  {
    title: "Prep hub",
    body: "Tools around the same data: draft practice, clutch scenarios, tower math.",
  },
];

const STACK = [
  "React",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "pg_cron",
  "SQL",
  "Python (Pandas)",
  "Tailwind",
  "Framer Motion",
  "GSAP",
];

const ApproachSection = () => (
  <section id="method" className="scroll-mt-14 px-5 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <SectionIntro
          eyebrow="Approach"
          title="Analysis only counts if it changes the next game."
          description="I turn scattered match history into a smaller, sharper set of decisions: what a player tends to do, what is already exposed, and what is still worth planning around."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-10 rounded-2xl border border-clash-gold/25 bg-clash-gold/[0.04] p-6"
        >
          <p className="label-caps text-clash-gold">How I build</p>
          <p className="mt-3 leading-relaxed text-foreground/90">
            I design the product, the data model and the analysis logic. The code is written AI-assisted, and I
            operate the system myself: scheduled data jobs, database migrations, privacy retention.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {STACK.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
          <ContributionGraph />
        </motion.div>
      </div>

      <ol className="grid gap-px self-start overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:col-span-7">
        {METHOD.map((m, i) => (
          <motion.li
            key={m.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative bg-background p-7 transition-colors duration-300 hover:bg-card sm:p-9"
          >
            <span className="font-mono text-5xl font-semibold text-foreground/10 transition-colors duration-300 group-hover:text-clash-gold/60">
              0{i + 1}
            </span>
            <h3 className="mt-6 text-xl font-semibold text-foreground">{m.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{m.body}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  </section>
);

export default ApproachSection;
