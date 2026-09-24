import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";

const EASE = [0.16, 1, 0.3, 1] as const;

/** A word of the quote; `parts` split it where the gold highlight starts or ends. */
type Token = { parts: { text: string; gold: boolean }[] };

/**
 * The quote as words, split on whitespace only - punctuation stays on its
 * word ("data," not "data ,"). Characters inside the highlighted phrase are
 * marked gold, even when the phrase ends mid-word before a comma.
 */
const tokenize = (quote: string, highlight?: string): Token[] => {
  const start = highlight ? quote.indexOf(highlight) : -1;
  const end = start < 0 ? -1 : start + (highlight as string).length;
  const tokens: Token[] = [];
  for (const m of quote.matchAll(/\S+/g)) {
    const from = m.index ?? 0;
    const word = m[0];
    const parts: Token["parts"] = [];
    for (let i = 0; i < word.length; i++) {
      const gold = from + i >= start && from + i < end;
      const last = parts[parts.length - 1];
      if (last && last.gold === gold) last.text += word[i];
      else parts.push({ text: word[i], gold });
    }
    tokens.push({ parts });
  }
  return tokens;
};

const Parts = ({ token }: { token: Token }) => (
  <>
    {token.parts.map((part, i) =>
      part.gold ? (
        <span key={i} className="text-clash-gold">
          {part.text}
        </span>
      ) : (
        part.text
      ),
    )}
  </>
);

/** One word that brightens as the reader scrolls past its share of the quote. */
const Word = ({ token, progress, range }: { token: Token; progress: MotionValue<number>; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }}>
      <Parts token={token} />
    </motion.span>
  );
};

const Quote = ({ t, index }: { t: Testimonial; index: number }) => {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const tokens = tokenize(t.quote, t.highlight);
  // Word by word from when the quote enters the lower screen until its end
  // passes the middle - read at scrolling speed, like the hero.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });

  return (
    <motion.figure
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: EASE }}
      className="relative"
    >
      <span
        aria-hidden="true"
        className="block select-none font-serif text-7xl leading-[0.6] text-clash-gold/50 sm:text-8xl sm:leading-[0.6]"
      >
        &ldquo;
      </span>
      <blockquote className="mt-2 text-xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl sm:leading-[1.25]">
        {tokens.map((token, i) => (
          <span key={i}>
            {reduceMotion ? (
              <Parts token={token} />
            ) : (
              <Word token={token} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} />
            )}{" "}
          </span>
        ))}
      </blockquote>

      <figcaption className="mt-10 flex items-center gap-4 border-t border-border/60 pt-6">
        {/* Monogram instead of a photo - no picture is used without asking. */}
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-clash-gold/50 text-lg font-semibold text-clash-gold"
        >
          {t.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-base font-semibold text-foreground">{t.name}</span>
            {t.profile && (
              <a
                href={t.profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-clash-gold"
              >
                {t.profile.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {t.role} · {t.context}
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
};

/**
 * What the people the analysis is for say about it. Heading on the left
 * (pinned on large screens), quotes on the right. Only approved quotes
 * (src/data/testimonials.ts) are shown - with none, the section is not
 * rendered at all.
 */
const TestimonialsSection = () => {
  const quotes = TESTIMONIALS.filter((t) => t.approved);
  if (quotes.length === 0) return null;

  return (
    <section id="testimonials" className="scroll-mt-14 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionIntro eyebrow="In their words" title="From the people the prep is for." />
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              Quoted with permission. Every author has confirmed the exact wording.
            </p>
          </div>
        </div>
        <div className="space-y-20 lg:col-span-8">
          {quotes.map((t, i) => (
            <Quote key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
