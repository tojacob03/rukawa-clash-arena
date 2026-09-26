// The character's body from the body you entered: height sets how tall the
// figure stands (leg length), weight relative to height (BMI) sets its build.
// 90 kg look lean at 1.95 m and heavy at 1.70 m. Friends only ever see these
// two factors, never the numbers.

export interface Body {
  /** Leg length and height, 0.84 … 1.16 (1 is about 1.78 m). */
  h: number;
  /** Build, 0.86 … 1.25 (1 is a BMI of about 24). */
  b: number;
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

/** Heights and weights the forms accept. */
export const HEIGHT_CM = { min: 120, max: 230 };

/** Body factors; null values fall back to an average figure. */
export function bodyOf(heightCm?: number | null, weightKg?: number | null): Body {
  const h = heightCm ? clamp(1 + (heightCm - 178) / 125, 0.84, 1.16) : 1;
  let b = 1;
  if (heightCm && weightKg) b = clamp(0.9 + (weightKg / (heightCm / 100) ** 2 - 21) * 0.0375, 0.86, 1.25);
  else if (weightKg) b = clamp(0.86 + (weightKg - 58) / 110, 0.86, 1.25);
  return { h: round2(h), b: round2(b) };
}

/** Build (b) and leg length (lf) of the drawn figure: from a friend's card, else from height and weight, else the look's height slider. */
export function figureFactors(lookHeight: number | undefined, heightCm?: number | null, weightKg?: number | null, body?: Body | null) {
  const fig = body ?? bodyOf(heightCm, weightKg);
  const slider = Number.isFinite(lookHeight) ? clamp(lookHeight ?? 0, -2, 2) : 0;
  return { b: fig.b, lf: body || heightCm ? fig.h : 1 + 0.08 * slider };
}
