import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A word of the quote - or, for the highlighted phrase, the whole phrase as
 * one token so its underline runs through. `parts` separate gold from plain
 * text (a comma right after the phrase stays attached, but not gold).
 */
type Token = { parts: { text: string; gold: boolean }[] };

const tokenize = (quote: string, highlight?: string): Token[] => {
  const start = highlight ? quote.indexOf(highlight) : -1;
  const end = start < 0 ? -1 : start + (highlight as string).length;
  const tokens: Token[] = [];
  let phrase: Token | null = null;

  const push = (token: Token, text: string, gold: boolean) => {
    const last = token.parts[token.parts.length - 1];
    if (last && last.gold === gold) last.text += text;
    else token.parts.push({ text, gold });
  };

  // Split on whitespace only, so punctuation stays on its word.
  for (const m of quote.matchAll(/\S+/g)) {
    const from = m.index ?? 0;
    const word = m[0];
    const inPhrase = start >= 0 && from < end && from + word.length > start;
    const token: Token = inPhrase && phrase ? phrase : { parts: [] };
    if (inPhrase && phrase) push(token, " ", true);
    for (let i = 0; i < word.length; i++) push(token, word[i], from + i >= start && from + i < end);
    if (token !== phrase) tokens.push(token);
    phrase = inPhrase ? token : null;
  }
  return tokens;
};

/**
 * One token that brightens as the reader scrolls past its share of the
 * quote. Opacity only - nothing moves, and it follows the reader's own
 * scrolling, so it stays on with reduced motion too. The highlighted phrase
 * also draws a gold underline as it is reached.
 */
const Word = ({ token, progress, range }: { token: Token; progress: MotionValue<number>; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const underline = useTransform(progress, [range[0], Math.min(1, range[1] + 0.08)], ["0% 2px", "100% 2px"]);
  return (
    <motion.span style={{ opacity }}>
      {token.parts.map((part, i) =>
        part.gold ? (
          <motion.span
            key={i}
            className="text-clash-gold"
            style={{
              backgroundImage: "linear-gradient(currentColor, currentColor)",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 95%",
              backgroundSize: underline,
              WebkitBoxDecorationBreak: "clone",
              boxDecorationBreak: "clone",
            }}
          >
            {part.text}
          </motion.span>
        ) : (
          part.text
        ),
      )}
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
      className="relative pt-10 sm:pt-14"
    >
      {/* Oversized quote mark behind the text */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 -top-6 select-none font-serif text-[9rem] leading-none text-clash-gold/15 sm:-left-6 sm:-top-10 sm:text-[13rem]"
      >
        &ldquo;
      </span>
      <blockquote className="relative text-[1.4rem] font-medium leading-snug tracking-tight text-foreground sm:text-3xl sm:leading-[1.25]">
        {tokens.map((token, i) => (
          <span key={i}>
            <Word token={token} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} />{" "}
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
          <span className="mt-0.5 block text-sm text-muted-foreground">{t.role}</span>
          <span className="mt-2 inline-block rounded-full border border-clash-gold/40 px-2.5 py-0.5 text-xs text-clash-gold">
            {t.context}
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
          </div>
        </div>
        <div className="space-y-24 lg:col-span-8">
          {quotes.map((t, i) => (
            <Quote key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
