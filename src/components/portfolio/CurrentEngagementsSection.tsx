import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";

const CurrentEngagementsSection = () => {
  return (
    <section id="current-engagements" className="px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="gradient-card border-border/50 p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-clash-gold/30 bg-clash-gold/10 p-3 text-clash-gold">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="border border-clash-gold/30 bg-clash-gold/10 text-clash-gold">Current</Badge>
                    <span className="text-xs text-muted-foreground">Since May 2026</span>
                  </div>
                  <h2 className="text-xl font-bold sm:text-2xl">Esports analyst · Solo CRL preparation</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Supporting competitive players including Morten and Viiper with opponent research and set
                    preparation. Details stay private; the work is reflected in the system above.
                  </p>
                </div>
              </div>
              <a href="#contact" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground">
                Work together <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CurrentEngagementsSection;
