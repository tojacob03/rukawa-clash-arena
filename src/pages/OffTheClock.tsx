import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
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
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <p className="font-mono text-sm text-muted-foreground/60">{index}</p>
        <p className="label-caps mt-2 text-clash-gold">{label}</p>
      </div>
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

  const gyms = [BJJ.home, ...BJJ.visited];

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
          <p className="label-caps mt-12 text-clash-gold">Till Oscar Jacob, known as Rukawa</p>
          <h1 className="mt-6 overflow-hidden text-[clamp(3.5rem,11vw,10rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-foreground">
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
            <Fact value="No-Gi" label={BJJ.style.toLowerCase()} />
            <Fact value={BJJ.home} label="home gym" />
          </dl>

          <div className="mt-10 rounded-2xl border border-clash-gold/25 bg-clash-gold/[0.04] p-6">
            <p className="label-caps text-muted-foreground">Current favourite</p>
            <p className="mt-2 text-2xl font-semibold text-clash-gold">{BJJ.favourite}</p>
            <p className="mt-1 text-sm text-muted-foreground">Changes about as often as the meta.</p>
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <p className="label-caps text-muted-foreground">Mat passport</p>
              <p className="text-sm text-muted-foreground">
                {gyms.length} gyms trained at · open mats on the road
              </p>
            </div>
            <ul className="mt-5 flex flex-wrap gap-3">
              {gyms.map((gym, i) => (
                <motion.li
                  key={gym}
                  initial={{ opacity: 0, scale: 1.4, rotate: 0 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: ((i * 37) % 7) - 3 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: [0.3, 1.4, 0.5, 1] }}
                  className={`rounded-md border-2 border-dashed px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] ${
                    gym === BJJ.home
                      ? "border-clash-gold text-clash-gold"
                      : "border-muted-foreground/40 text-muted-foreground"
                  }`}
                >
                  {gym === BJJ.home ? `${gym} · home` : gym}
                </motion.li>
              ))}
            </ul>
          </div>
        </Chapter>

        <Chapter index="02" label="Coffee">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            {COFFEE.method}. Always.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            In the grinder right now: <span className="text-foreground">{COFFEE.bean}</span> from{" "}
            <span className="text-foreground">{COFFEE.roaster}</span> in {COFFEE.from}. {COFFEE.note}
          </p>
        </Chapter>

        <Chapter index="03" label="Reading">
          <p className="label-caps text-muted-foreground">Currently on the nightstand</p>
          <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            {READING.title}
          </h2>
          <p className="mt-2 text-lg text-clash-gold">{READING.author}</p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Poirot&apos;s first case. Small details, ruled-out suspects and one answer left at the end – not far from
            working out which deck is still in someone&apos;s hand.
          </p>
        </Chapter>

        <Chapter index="04" label="Fragrance">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            No fixed rotation.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            What goes on in the morning changes with the mood, the weather and the day ahead. The one decision here I
            refuse to put in a spreadsheet.
          </p>
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
