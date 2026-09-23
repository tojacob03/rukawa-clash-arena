import { useEffect, useMemo, useState } from "react";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import PriceCurve from "@/components/energy/PriceCurve";
import PriceHeatmap from "@/components/energy/PriceHeatmap";
import { MonthlyChart, RenewablesScatter } from "@/components/energy/MarketCharts";
import {
  ENERGY_COLORS,
  findWindow,
  fmtDateTime,
  fmtEuro,
  fmtNumber,
  fmtTime,
  fmtWeekday,
  toCentPerKwh,
  useEnergyDashboard,
  type EnergyDashboard,
} from "@/lib/energy";

const DURATIONS = [1, 2, 3, 4] as const;

const tabular = { fontVariantNumeric: "tabular-nums" } as const;

const Segmented = <const T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) => (
  <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
    {options.map((o) => (
      <button
        key={String(o)}
        type="button"
        aria-pressed={o === value}
        onClick={() => onChange(o)}
        className={`rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(45_100%_60%)] ${
          o === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {render(o)}
      </button>
    ))}
  </div>
);

const Section = ({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) => (
  <section className="border-t border-border/60 py-14 sm:py-16">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">{intro}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
);

const Dashboard = ({ data }: { data: EnergyDashboard }) => {
  const today = data.meta.today;
  const hasTomorrow = data.days.some((d) => d.date !== today);
  const [dayKey, setDayKey] = useState<"heute" | "morgen">(hasTomorrow ? "morgen" : "heute");
  const [hours, setHours] = useState<(typeof DURATIONS)[number]>(2);
  const [kwh, setKwh] = useState(10);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const day = data.days.find((d) => (dayKey === "heute" ? d.date === today : d.date !== today)) ?? data.days[0];
  const isToday = day?.date === today;
  const fromMs = isToday ? Math.floor(now / (15 * 60 * 1000)) * 15 * 60 * 1000 : -Infinity;

  const cheapest = useMemo(() => (day ? findWindow(day.points, hours * 4, "min", fromMs) : null), [day, hours, fromMs]);
  const priciest = useMemo(() => (day ? findWindow(day.points, hours * 4, "max") : null), [day, hours]);

  if (!day) {
    return <p className="text-muted-foreground">Für heute und morgen liegen noch keine Preise vor.</p>;
  }

  const dayWord = isToday ? "Heute" : "Morgen";
  const savingsCt = priciest && cheapest ? toCentPerKwh(priciest.avg - cheapest.avg) : 0;
  const costAt = (eurPerMwh: number) => (kwh * eurPerMwh) / 1000;
  const s365 = data.summary_365;

  return (
    <>
      {/* Hero: the answer first, the curve proves it */}
      <section className="pb-14 pt-10 sm:pb-16 sm:pt-14">
        <div className="flex flex-wrap items-center gap-3">
          {hasTomorrow && (
            <Segmented
              label="Tag"
              options={["heute", "morgen"] as const}
              value={dayKey}
              onChange={(v) => setDayKey(v as "heute" | "morgen")}
              render={(v) => (v === "heute" ? "Heute" : "Morgen")}
            />
          )}
          <Segmented
            label="Dauer"
            options={DURATIONS}
            value={hours}
            onChange={(v) => setHours(v as (typeof DURATIONS)[number])}
            render={(v) => `${v} Std.`}
          />
        </div>

        {cheapest ? (
          <h2 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl" style={tabular}>
            {isToday
              ? `Heute ist Strom ab jetzt von ${fmtTime(cheapest.start)} bis ${fmtTime(cheapest.end)} Uhr am günstigsten.`
              : `${dayWord}, ${fmtWeekday(day.date)}, ist Strom von ${fmtTime(cheapest.start)} bis ${fmtTime(cheapest.end)} Uhr am günstigsten.`}
          </h2>
        ) : (
          <h2 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Für heute ist kein ganzes {hours}-Stunden-Fenster mehr übrig.
          </h2>
        )}

        {cheapest && priciest && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={tabular}>
            Im Schnitt {fmtNumber(toCentPerKwh(cheapest.avg), 1)} ct/kWh an der Börse, also{" "}
            {fmtNumber(savingsCt, 1)} ct weniger als im teuersten {hours}-Stunden-Fenster des Tages ({fmtTime(priciest.start)}–
            {fmtTime(priciest.end)} Uhr).
          </p>
        )}

        <div className="mt-10">
          <PriceCurve points={day.points} window={cheapest} nowMs={isToday ? now : undefined} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4" style={tabular}>
          <div>
            <dt className="text-muted-foreground">Tagesdurchschnitt</dt>
            <dd className="mt-1 text-lg font-medium text-foreground">{fmtNumber(day.stats.avg, 1)} €/MWh</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Günstigste Viertelstunde</dt>
            <dd className="mt-1 text-lg font-medium text-foreground">{fmtNumber(day.stats.min, 1)} €/MWh</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Teuerste Viertelstunde</dt>
            <dd className="mt-1 text-lg font-medium text-foreground">{fmtNumber(day.stats.max, 1)} €/MWh</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Negative Preise</dt>
            <dd className="mt-1 text-lg font-medium text-foreground">
              {day.stats.negative_qh === 0 ? "keine" : `${day.stats.negative_qh} Viertelstunden`}
            </dd>
          </div>
        </dl>

        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ENERGY_COLORS.cheap }} /> günstig
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ENERGY_COLORS.expensive }} /> teuer
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ENERGY_COLORS.negative }} /> negativ
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: ENERGY_COLORS.window, opacity: 0.35 }} /> günstigstes Fenster
          </span>
        </p>
      </section>

      <Section
        title="Was bringt es, den Verbrauch zu verschieben?"
        intro="Mit einem dynamischen Stromtarif zahlst du den Börsenpreis der jeweiligen Viertelstunde plus feste Aufschläge. Der Rechner zeigt nur den Börsenanteil, denn Steuern, Umlagen und Netzentgelte sind zu jeder Uhrzeit gleich."
      >
        <label className="block max-w-xs text-sm text-muted-foreground" htmlFor="kwh">
          Strommenge in kWh
          <span className="mt-1 block text-xs">z. B. 10 kWh für eine Autoladung im Alltag, 1 kWh für eine Waschmaschine</span>
        </label>
        <input
          id="kwh"
          type="number"
          min={0}
          step={1}
          inputMode="decimal"
          value={Number.isFinite(kwh) ? kwh : ""}
          onChange={(e) => setKwh(Math.max(0, Number(e.target.value)))}
          className="mt-3 w-32 rounded-md border border-border bg-secondary/40 px-3 py-2 text-lg text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(45_100%_60%)]"
          style={tabular}
        />

        {cheapest && priciest ? (
          <table className="mt-8 w-full max-w-lg text-left text-sm" style={tabular}>
            <tbody className="divide-y divide-border/60">
              <tr>
                <th className="py-3 font-normal text-muted-foreground">
                  {isToday ? "Günstigstes verbleibendes Fenster" : "Günstigstes Fenster"} ({fmtTime(cheapest.start)}–
                  {fmtTime(cheapest.end)} Uhr)
                </th>
                <td className="py-3 text-right text-lg font-medium" style={{ color: ENERGY_COLORS.cheap }}>
                  {fmtEuro(costAt(cheapest.avg))}
                </td>
              </tr>
              <tr>
                <th className="py-3 font-normal text-muted-foreground">Zum Tagesdurchschnitt</th>
                <td className="py-3 text-right text-lg font-medium text-foreground">{fmtEuro(costAt(day.stats.avg))}</td>
              </tr>
              <tr>
                <th className="py-3 font-normal text-muted-foreground">
                  Teuerstes Fenster ({fmtTime(priciest.start)}–{fmtTime(priciest.end)} Uhr)
                </th>
                <td className="py-3 text-right text-lg font-medium" style={{ color: ENERGY_COLORS.expensive }}>
                  {fmtEuro(costAt(priciest.avg))}
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
        {cheapest && cheapest.avg < 0 && (
          <p className="mt-4 max-w-lg text-sm text-muted-foreground">
            Der Börsenpreis ist in diesem Fenster negativ. Wer genau dann verbraucht, senkt seine Kosten, weil zu viel Strom
            im Netz ist.
          </p>
        )}
      </Section>

      {data.heatmap.length > 0 && (
        <Section
          title="Wann Strom meistens günstig ist"
          intro="Durchschnittspreis je Wochentag und Stunde über die letzten 90 Tage. Mittags drückt die Solarenergie die Preise, am frühen Abend steigt die Nachfrage, während die Sonne weg ist."
        >
          <PriceHeatmap cells={data.heatmap} />
        </Section>
      )}

      {data.daily.length > 0 && (
        <Section
          title="Mehr Wind und Sonne, niedrigere Preise"
          intro={`Jeder Punkt ist ein Tag der letzten sechs Monate. Wind- und Solarstrom kosten in der Erzeugung fast nichts und verdrängen teurere Kraftwerke aus dem Markt (Merit-Order-Effekt).${
            s365?.corr_price_re != null
              ? ` Über ein Jahr liegt die Korrelation bei ${fmtNumber(s365.corr_price_re, 2)}: je höher der Anteil, desto niedriger der Tagespreis.`
              : ""
          }`}
        >
          <RenewablesScatter daily={data.daily} />
          <p className="mt-2 text-xs text-muted-foreground">Senkrecht: Tagesdurchschnittspreis in €/MWh</p>
        </Section>
      )}

      {data.monthly.length > 0 && (
        <Section
          title="Negative Preise werden häufiger"
          intro={`Blaue Balken zeigen, wie viele Stunden pro Monat der Börsenpreis unter null lag, die Linie den Monatsdurchschnitt. ${
            s365 ? `In den letzten 365 Tagen waren es ${fmtNumber(s365.neg_hours, 0)} Stunden an ${s365.days_with_negative} Tagen.` : ""
          } Seit 2025 bekommen neue Solaranlagen in solchen Viertelstunden keine Einspeisevergütung mehr.`}
        >
          <MonthlyChart monthly={data.monthly} />
          <p className="mt-2 text-xs text-muted-foreground">Links: Stunden mit negativem Preis. Rechts: Durchschnittspreis in €/MWh</p>
        </Section>
      )}

      <section className="border-t border-border/60 py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Woher die Zahlen kommen</h2>
        <ol className="mt-6 grid max-w-4xl gap-6 text-sm leading-relaxed text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="block text-base font-medium text-foreground">1. Abrufen</span>
            Alle drei Stunden holt ein Datenbank-Job Day-Ahead-Preise, Wind- und Solarerzeugung und Verbrauch von SMARD, der
            Strommarkt-Plattform der Bundesnetzagentur.
          </li>
          <li>
            <span className="block text-base font-medium text-foreground">2. Speichern</span>
            Die Werte landen in einer Postgres-Datenbank in Frankfurt, als Viertelstunden seit Oktober 2025 und als
            Stundenwerte seit 2023.
          </li>
          <li>
            <span className="block text-base font-medium text-foreground">3. Auswerten</span>
            Nach jedem Abruf rechnet SQL alle Kennzahlen dieser Seite neu. Die Seite selbst liest nur das fertige Ergebnis.
          </li>
        </ol>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground" style={tabular}>
          Datenquelle:{" "}
          <a href="https://www.smard.de" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Bundesnetzagentur | SMARD.de
          </a>
          , Lizenz{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            CC BY 4.0
          </a>
          . Day-Ahead-Großhandelspreise für das Marktgebiet Deutschland/Luxemburg, ohne Steuern, Umlagen und Netzentgelte.
          Keine Energie- oder Finanzberatung.
          {data.meta.last_ingest_at && <> Zuletzt aktualisiert am {fmtDateTime(data.meta.last_ingest_at)} Uhr.</>}
        </p>
      </section>
    </>
  );
};

const Strompreis = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useEnergyDashboard();

  useEffect(() => {
    const previous = document.title;
    document.title = "Strompreis-Kompass | Rukawa Analytics";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main lang="de" className="mx-auto max-w-6xl px-5 sm:px-6">
        <header className="pt-12 sm:pt-16">
          <h1 className="text-base font-semibold text-foreground">Strompreis-Kompass</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Wann Strom an der Börse am günstigsten ist, aus den offiziellen Daten der Bundesnetzagentur, alle drei Stunden
            aktualisiert.
          </p>
        </header>

        {isLoading && (
          <div className="py-16" aria-busy="true">
            <div className="h-14 max-w-3xl animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            <div className="mt-10 h-72 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          </div>
        )}

        {isError && (
          <div className="py-16">
            <p className="max-w-xl text-foreground">
              Die Strompreise konnten nicht geladen werden{error instanceof Error ? ` (${error.message})` : ""}.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary disabled:opacity-60"
            >
              {isFetching ? "Wird geladen…" : "Erneut laden"}
            </button>
          </div>
        )}

        {data && <Dashboard data={data} />}
      </main>
      <Footer />
    </div>
  );
};

export default Strompreis;
