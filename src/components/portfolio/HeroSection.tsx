import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/smoothScroll";

// Typographic hero: the claim first, then proof. No background artwork,
// no gradients, no floating decoration - the numbers carry it.
const proof = [
  { value: "Top 2, 3 & 4", label: "CRL Monthly Finals results of players I prepared" },
  { value: "2 players", label: "qualified for the CRL World Finals 2026" },
  { value: "Since 2019", label: "analyst for teams, a national team and players" },
];

const HeroSection = () => {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
        <p className="text-sm text-muted-foreground">Till Oscar Jacob, known as Rukawa</p>

        <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          I turn battle logs into set decisions.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Clash Royale analyst for Solo CRL, currently preparing two players for the CRL World Finals. I build the data
          tooling behind it myself, and use the same approach beyond esports.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Button size="lg" className="px-6" onClick={() => scrollToSection("work")}>
            See the work
          </Button>
          <button
            type="button"
            onClick={() => scrollToSection("contact")}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-clash-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get in touch
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>
        </div>

        <dl className="mt-16 grid gap-8 border-t border-border/60 pt-8 sm:grid-cols-3 sm:gap-6">
          {proof.map((item) => (
            <div key={item.value} className="flex flex-col gap-1">
              <dt className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{item.label}</dt>
              {/* Value shown above its label, so all three values line up. */}
              <dd className="order-first text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default HeroSection;
