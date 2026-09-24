import { motion } from "framer-motion";
import SectionIntro from "@/components/portfolio/SectionIntro";
import { TESTIMONIALS } from "@/data/testimonials";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * What the people the analysis is for say about it. One quote reads as a
 * single large pull quote; more line up in a grid. Only approved quotes
 * (src/data/testimonials.ts) are shown - with none, the section is not
 * rendered at all.
 */
const TestimonialsSection = () => {
  const quotes = TESTIMONIALS.filter((t) => t.approved);
  if (quotes.length === 0) return null;
  const single = quotes.length === 1;

  return (
    <section id="testimonials" className="scroll-mt-14 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="In their words" title="From the people the prep is for." />

        <div className={`mt-14 grid gap-12 ${single ? "" : "lg:grid-cols-2 lg:gap-16"}`}>
          {quotes.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              className={`relative border-l-2 border-clash-gold pl-6 pt-12 sm:pl-10 sm:pt-14 ${single ? "max-w-4xl" : ""}`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-5 top-0 select-none font-serif text-7xl leading-none text-clash-gold/40 sm:left-9 sm:text-8xl"
              >
                &ldquo;
              </span>
              <blockquote
                className={`relative font-medium leading-snug tracking-tight text-foreground ${
                  single ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"
                }`}
              >
                {t.quote}
              </blockquote>
              <figcaption className="mt-8">
                <span className="block text-base font-semibold text-foreground">{t.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {t.role} · {t.context}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
