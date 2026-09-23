import { useMemo } from "react";
import { ENERGY_COLORS, fmtNumber, priceColor } from "@/lib/energy";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

type PriceHeatmapProps = {
  /** [isoWeekday 1-7, hour 0-23, average €/MWh] */
  cells: [number, number, number][];
};

const PriceHeatmap = ({ cells }: PriceHeatmapProps) => {
  const { grid, min, max } = useMemo(() => {
    const grid: (number | null)[][] = Array.from({ length: 7 }, () => Array(24).fill(null));
    let min = Infinity;
    let max = -Infinity;
    for (const [dow, hour, avg] of cells) {
      grid[dow - 1][hour] = avg;
      min = Math.min(min, avg);
      max = Math.max(max, avg);
    }
    return { grid, min, max };
  }, [cells]);

  if (!cells.length) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[560px] gap-[3px]"
          style={{ gridTemplateColumns: "2rem repeat(24, minmax(0, 1fr))" }}
        >
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <div className="flex items-center text-xs text-muted-foreground">{WEEKDAYS[d]}</div>
              {row.map((v, h) => (
                <div
                  key={h}
                  className="aspect-square rounded-[3px]"
                  style={{ background: v === null ? "hsl(var(--muted))" : priceColor(v, min, max) }}
                  title={
                    v === null
                      ? undefined
                      : `${WEEKDAYS_LONG[d]}, ${String(h).padStart(2, "0")}–${String(h + 1).padStart(2, "0")} Uhr: Ø ${fmtNumber(v, 1)} €/MWh`
                  }
                />
              ))}
            </div>
          ))}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="pt-1 text-[11px] text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
        <span>{fmtNumber(Math.max(0, min), 0)} €/MWh</span>
        <div
          className="h-2 w-40 rounded-full"
          style={{
            background: `linear-gradient(to right, ${ENERGY_COLORS.cheap}, ${ENERGY_COLORS.mid}, ${ENERGY_COLORS.expensive})`,
          }}
        />
        <span>{fmtNumber(max, 0)} €/MWh</span>
        {min < 0 && (
          <span className="ml-3 inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ENERGY_COLORS.negative }} /> im Schnitt negativ
          </span>
        )}
      </div>
    </div>
  );
};

export default PriceHeatmap;
