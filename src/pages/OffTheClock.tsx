import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import FragranceChapter from "@/components/offTheClock/FragranceChapter";
import MatAtlas from "@/components/offTheClock/MatAtlas";
import CoffeeJourney from "@/components/offTheClock/CoffeeJourney";
import Book3D from "@/components/offTheClock/Book3D";
import { BJJ, COFFEE, READING } from "@/data/offTheClock";

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.7, ease: EASE },
};

const Chapter = ({ index, label, children }: { index: string; label: string; children: React.ReactNode }) => (
  <motion.section {...reveal} className="border-t border-border/60 py-16 sm:py-20">
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <p className="flex items-baseline gap-3 lg:col-span-3 lg:block">
        <span className="text-sm text-muted-foreground/60" style={{ fontVariantNumeric: "tabular-nums" }}>
          {index}
        </span>
        <span className="text-sm font-medium text-clash-gold lg:mt-1 lg:block">{label}</span>
      </p>
      <div className="lg:col-span-9">{children}</div>
    </div>
  </motion.section>
);

const Fact = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
    <dd className="order-first text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</dd>
  </div>
);

const OffTheClock = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = "Off the clock | Rukawa Analytics";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="pb-16 pt-16 sm:pb-24 sm:pt-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the work
          </Link>
          <p className="mt-12 text-sm text-muted-foreground">Till Oscar Jacob, known as Rukawa</p>
          <h1 className="mt-4 overflow-hidden text-[clamp(3.5rem,11vw,10rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-foreground">
            <motion.span
              className="block"
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, ease: EASE }}
            >
              Off the <span className="text-clash-gold">clock.</span>
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            What I do when I am not reading battle logs. Different arenas, same habit: study the position, then commit.
          </motion.p>
        </header>

        <Chapter index="01" label="Grappling">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            Positions before submissions.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Brazilian jiu-jitsu and submission grappling, almost all of it without the gi. On the mat it is positional
            chess under pressure: you drill a situation until the right decision comes without thinking – the same idea
            behind preparing a set.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border/60 pt-8 md:grid-cols-4">
            <Fact value={BJJ.since} label="on the mat since" />
            <Fact value={BJJ.belt} label="current rank" />
            <Fact value={BJJ.goal} label="next goal" />
            <Fact value="Checkmat" label="home gym, Oldenburg" />
          </dl>

          <div className="mt-10 rounded-2xl border border-clash-gold/25 bg-clash-gold/[0.04] p-6">
            <p className="text-sm text-muted-foreground">Current favourite</p>
            <p className="mt-1 text-2xl font-semibold text-clash-gold">{BJJ.favourite}</p>
            <p className="mt-2 text-sm text-foreground/90">{BJJ.favouriteExplainer}</p>
            <p className="mt-1 text-sm text-muted-foreground">Changes about as often as the meta.</p>
          </div>

          <MatAtlas />
        </Chapter>

        <Chapter index="02" label="Coffee">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            {COFFEE.method}. Always.
          </h2>
          <div className="mt-8 max-w-xl rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-4">
              <p className="text-sm text-muted-foreground">In the grinder</p>
              <p className="text-sm text-muted-foreground">{COFFEE.note}</p>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{COFFEE.bean}</p>
            <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Roaster</dt>
                <dd className="mt-1 font-medium text-foreground">{COFFEE.roaster}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">From</dt>
                <dd className="mt-1 font-medium text-foreground">{COFFEE.from}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="mt-1 font-medium text-foreground">{COFFEE.method}</dd>
              </div>
            </dl>
          </div>
          <CoffeeJourney />
        </Chapter>

        <Chapter index="03" label="Reading">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
            <Book3D title={READING.title} author={READING.author} year={READING.year} />
            <div>
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl">
                {READING.title}
              </h2>
              <p className="mt-2 text-lg text-clash-gold">
                {READING.author}, {READING.year}
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Poirot&apos;s first case. Small details, ruled-out suspects and one answer left at the end – not far from
                working out which deck is still in someone&apos;s hand.
              </p>
              {READING.previous.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm text-muted-foreground">Read before</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {READING.previous.map((b) => (
                      <li key={b.title} className="text-foreground">
                        {b.title} <span className="text-muted-foreground">– {b.author}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Chapter>

        <Chapter index="04" label="Fragrance">
          <FragranceChapter />
        </Chapter>

        <section className="border-t border-border/60 py-16 sm:py-20">
          <p className="text-2xl font-semibold text-foreground sm:text-3xl">Back to the day job?</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
            <Link to="/#work" className="text-clash-gold transition-colors hover:text-foreground">
              See the analysis system →
            </Link>
            <Link to="/#contact" className="text-muted-foreground transition-colors hover:text-foreground">
              Say hi →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OffTheClock;
