import SectionIntro from "@/components/portfolio/SectionIntro";
import { Card } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="about" className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="The short version"
          title="What I bring to a set."
          description="Analysis is only useful when it changes what happens next."
          align="left"
          titleClassName="text-3xl font-bold sm:text-4xl md:text-5xl"
          descriptionClassName="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Card className="gradient-card md:col-span-2 md:row-span-2 border-border/50 p-6 shadow-card sm:p-8">
            <p className="max-w-xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              I turn scattered match history into a smaller, sharper set of decisions.
            </p>
            <p className="mt-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
              The goal is not more dashboards for their own sake. It is simple visibility into what a player tends to
              do, what is already exposed, and what is still worth planning around.
            </p>
          </Card>

          <Card className="gradient-card border-border/50 p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Focus</p>
            <h3 className="mt-2 text-xl font-semibold">Solo CRL preparation</h3>
            <p className="mt-2 text-sm text-muted-foreground">Opponent tendencies, Game 1 habits, and set context.</p>
          </Card>

          <Card className="gradient-card border-border/50 p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Output</p>
            <p className="mt-2 text-lg font-semibold">Clearer prep</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Less noise before the next set.</p>
          </Card>

          <Card className="gradient-card border-border/50 p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Medium</p>
            <p className="mt-2 text-lg font-semibold">Private tooling</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Built around the actual workflow.</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
