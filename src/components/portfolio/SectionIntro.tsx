import { motion } from "framer-motion";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleClassName?: string;
  descriptionClassName?: string;
};

const SectionIntro = ({
  eyebrow,
  title,
  description,
  align = "left",
  titleClassName = "text-3xl font-bold sm:text-4xl md:text-5xl",
  descriptionClassName = "mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
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
        transition={{ duration: 0.55, ease: "easeOut" }}
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
        className="text-[10px] uppercase tracking-[0.28em] text-clash-gold"
      >
        {eyebrow}
      </motion.p>

      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`${titleClassName} ${centered ? "mx-auto" : ""}`}
      >
        {title}
      </motion.h2>

      {description && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
          className={`${descriptionClassName} ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
};

export default SectionIntro;
