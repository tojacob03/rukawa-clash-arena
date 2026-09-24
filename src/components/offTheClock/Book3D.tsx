import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const COVER = "#23392f";
const INK = "#f3e9cc";
const INK_SOFT = "#e9dcb8";
const W = 176; // cover width, px
const H = 264; // cover height (2:3)
const D = 30; // thickness

/**
 * The book on the nightstand as an object, not a picture: a CSS 3D block
 * with spine and page edges. Rests at an angle showing the spine; follows
 * the pointer and turns to face you on hover.
 */
const Book3D = ({ title, author, year }: { title: string; author: string; year: number }) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0); // -0.5 .. 0.5 across the book
  const py = useMotionValue(0);
  const hover = useMotionValue(0);
  const spring = { stiffness: 140, damping: 18, mass: 0.6 };

  const rotateY = useSpring(
    useTransform([px, hover] as never, ([x, h]: number[]) => 30 - h * 26 + x * 18),
    spring,
  );
  const rotateX = useSpring(useTransform(py, (y) => 6 - y * 14), spring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType === "touch") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!reduceMotion && e.pointerType !== "touch") hover.set(1);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
    hover.set(0);
  };

  const face = "absolute left-0 top-0 [backface-visibility:hidden]";
  const serif = { fontFamily: "Georgia, 'Times New Roman', serif" };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className="relative shrink-0 py-4"
      style={{ perspective: 1100, width: W + 40, height: H + 32 }}
      aria-hidden="true"
    >
      {/* Shadow on the "table" */}
      <div
        className="absolute bottom-1 left-6 h-6 rounded-[50%] bg-black/50 blur-lg"
        style={{ width: W - 10 }}
      />
      <motion.div
        className="relative mx-auto"
        style={{
          width: W,
          height: H,
          transformStyle: "preserve-3d",
          rotateY: reduceMotion ? 24 : rotateY,
          rotateX: reduceMotion ? 4 : rotateX,
        }}
      >
        {/* Front cover */}
        <div
          className={`${face} flex flex-col justify-between rounded-r-md rounded-l-sm p-4`}
          style={{
            ...serif,
            width: W,
            height: H,
            transform: `translateZ(${D / 2}px)`,
            background: `linear-gradient(90deg, rgba(0,0,0,0.35) 0, rgba(0,0,0,0) 9%), linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.15)), ${COVER}`,
          }}
        >
          <span className="text-[10px] tracking-[0.2em]" style={{ color: `${INK_SOFT}b3` }}>
            {author.toUpperCase()}
          </span>
          <span className="text-xl leading-tight" style={{ color: INK }}>
            {title}
          </span>
          <span className="flex items-center justify-between">
            <span className="h-px w-8" style={{ background: `${INK_SOFT}80` }} />
            <span className="text-[10px] tracking-[0.2em]" style={{ color: `${INK_SOFT}99` }}>
              {year}
            </span>
          </span>
        </div>

        {/* Spine */}
        <div
          className={`${face} flex items-center justify-center overflow-hidden`}
          style={{
            width: D,
            height: H,
            left: (W - D) / 2,
            transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
            background: `linear-gradient(90deg, rgba(0,0,0,0.25), rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.3)), ${COVER}`,
          }}
        >
          <span
            className="whitespace-nowrap text-[9px] tracking-[0.14em]"
            style={{ ...serif, color: INK_SOFT, writingMode: "vertical-rl" }}
          >
            {title.toUpperCase()}
          </span>
        </div>

        {/* Page edges */}
        <div
          className={face}
          style={{
            width: D - 4,
            height: H - 8,
            top: 4,
            left: (W - D + 4) / 2,
            transform: `rotateY(90deg) translateZ(${W / 2 - 3}px)`,
            background: "repeating-linear-gradient(90deg, #efe6cf 0 1px, #d9ceb2 1px 2px)",
          }}
        />
        <div
          className={face}
          style={{
            width: W - 6,
            height: D - 4,
            left: 3,
            top: (H - D + 4) / 2,
            transform: `rotateX(90deg) translateZ(${H / 2 - 3}px)`,
            background: "repeating-linear-gradient(0deg, #efe6cf 0 1px, #d9ceb2 1px 2px)",
          }}
        />

        {/* Back cover */}
        <div
          className={`${face} rounded-l-md rounded-r-sm`}
          style={{ width: W, height: H, transform: `rotateY(180deg) translateZ(${D / 2}px)`, background: COVER }}
        />
      </motion.div>
    </div>
  );
};

export default Book3D;
