import { motion } from "framer-motion";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Optional editorial index, e.g. "01" - rendered small and dim beside the title. */
  index?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

// Shared easing across the site's motion language (matches --ease-out-expo).
const EASE = [0.16, 1, 0.3, 1] as const;

const SectionIntro = ({
  eyebrow,
  title,
  description,
  align = "left",
  index,
  // Display scale carries its own tracking/leading - no font-bold here, the
  // display face at 600 reads stronger and cleaner than a faux-bolded 700.
  titleClassName = "text-display-md font-semibold",
  descriptionClassName = "mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg",
}: SectionIntroProps) => {
  const centered = align === "center";

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.45 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={centered ? "text-center" : ""}
    >
      <motion.div
        variants={{
          hidden: { scaleX: 0, opacity: 0 },
          visible: { scaleX: 1, opacity: 1 },
        }}
        transition={{ duration: 0.55, ease: EASE }}
        className={`mb-4 h-px w-20 origin-left bg-gradient-to-r from-clash-gold via-clash-gold to-clash-blue ${
          centered ? "mx-auto origin-center" : ""
        }`}
      />

      <motion.p
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.35 }}
        className="label-caps text-clash-gold"
      >
        {eyebrow}
      </motion.p>

      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        transition={{ duration: 0.65, ease: EASE }}
        className={`mt-3 ${titleClassName} ${centered ? "mx-auto" : ""} ${
          index ? "flex items-baseline gap-4" : ""
        } ${centered && index ? "justify-center" : ""}`}
      >
        {index && (
          <span className="font-mono text-sm font-normal tracking-normal text-muted-foreground/40">{index}</span>
        )}
        <span>{title}</span>
      </motion.h2>

      {description && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: EASE }}
          className={`${descriptionClassName} ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
};

export default SectionIntro;
