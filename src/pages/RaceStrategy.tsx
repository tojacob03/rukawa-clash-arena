import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteNav from "@/components/portfolio/SiteNav";
import Footer from "@/components/portfolio/Footer";
import StintChart from "@/components/racing/StintChart";
import { PaceBars, PitCrewBars, StopsChart, TyreCurveChart } from "@/components/racing/RaceCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COMPOUND_COLORS,
  COMPOUND_ORDER,
  compoundColor,
  compoundLabel,
  fmtDate,
  fmtSec,
  fmtSigned,
  lastName,
  stopWord,
  useRacingIndex,
  useRacingRace,
  useRacingSeason,
  type RacePayload,
} from "@/lib/racing";

const tabular = { fontVariantNumeric: "tabular-nums" } as const;

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

const Headline = ({ data }: { data: RacePayload }) => {
  const winner = data.drivers.find((d) => d.position === 1);
  const finishers = data.drivers.filter((d) => d.position !== null && d.status === null);
  const stopCounts = finishers.map((d) => d.pits?.length ?? 0);
  const winnerStops = winner?.pits?.length ?? 0;
  const sameAsWinner = stopCounts.filter((n) => n === winnerStops).length;

  return (
    <>
      <h2 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {winner
          ? `${lastName(winner.name)} won the ${data.race.name ?? "race"} on a ${stopWord(winnerStops)}.`
          : `${data.race.name ?? "Race"}: results pending.`}
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={tabular}>
        {fmtDate(data.race.date)}, {data.race.circuit}. {data.race.total_laps} laps
        {finishers.length > 0 && `, ${sameAsWinner} of ${finishers.length} finishers used the same number of stops as the winner`}.
      </p>
    </>
  );
};

const RaceView = ({ data }: { data: RacePayload }) => {
  const deg = [...data.degradation].sort(
    (a, b) => COMPOUND_ORDER.indexOf(a.compound) - COMPOUND_ORDER.indexOf(b.compound),
  );
  const usedCompounds = COMPOUND_ORDER.filter((c) => data.drivers.some((d) => d.stints?.some((s) => s[0] === c)));

  return (
    <>
      <section className="pb-14 sm:pb-16">
        <Headline data={data} />
        <div className="mt-10">
          <StintChart drivers={data.drivers} totalLaps={data.race.total_laps} />
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {usedCompounds.map((c) => (
            <span key={c} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-4 rounded-sm" style={{ background: compoundColor(c) }} /> {compoundLabel(c)}
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-4 rounded-sm border border-dashed border-muted-foreground opacity-60" /> used tyres
          </span>
          <span>Rows in finishing order. Hover or tap a stint for details.</span>
        </p>
      </section>

      <Section
        title="How fast the tyres wore out"
        intro={`Each line shows how much slower drivers got as their tyres aged, compared with their own typical lap. Lap times are corrected for fuel burn (${fmtSec(
          data.race.fuel_correction,
        )} s per lap), otherwise the car getting lighter would hide the tyre wear.`}
      >
        <TyreCurveChart curve={data.tyre_curve} />
        {deg.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3" style={tabular}>
            {deg.map((d) => (
              <div key={d.compound}>
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: compoundColor(d.compound) }} />
                  {compoundLabel(d.compound)}
                </dt>
                <dd className="mt-1 text-lg font-medium text-foreground">{fmtSigned(d.sec_per_lap, 3)} s per lap</dd>
                <dd className="text-xs text-muted-foreground">
                  from {d.stints} stints{d.stints < 4 ? ", little data" : ""}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section
        title="Race pace"
        intro="Median fuel-corrected lap time on clean laps, as a gap to the quickest driver. Traffic, safety car laps and pit laps are filtered out, so this is closer to true car and driver speed than the final result."
      >
        <PaceBars drivers={data.drivers} />
      </Section>
    </>
  );
};

const SeasonView = ({ year }: { year: number }) => {
  const { data } = useRacingSeason(year);
  if (!data) return null;
  const deg = [...data.degradation].sort(
    (a, b) => COMPOUND_ORDER.indexOf(a.compound) - COMPOUND_ORDER.indexOf(b.compound),
  );

  return (
    <>
      <Section
        title={`${year}: the fastest pit crews`}
        intro="Median time the car stood still in the pit box, per team. Stops longer than 10 seconds (problems, penalties) are left out. The bracket shows the team's single quickest stop."
      >
        <PitCrewBars crews={data.pit_crews} />
      </Section>

      {data.stops_per_race.length > 0 && (
        <Section
          title={`${year}: how many stops, race by race`}
          intro={`Average number of pit stops per classified finisher. High-wear tracks push teams to two stops, others reward staying out.${
            deg.length
              ? ` Season average wear: ${deg
                  .filter((d) => COMPOUND_COLORS[d.compound])
                  .map((d) => `${compoundLabel(d.compound)} ${fmtSigned(d.sec_per_lap, 3)} s/lap`)
                  .join(", ")}.`
              : ""
          }`}
        >
          <StopsChart rows={data.stops_per_race} />
        </Section>
      )}
    </>
  );
};

const RaceStrategy = () => {
  const index = useRacingIndex();
  const [year, setYear] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);

  // Default: the most recent race that has been analysed.
  useEffect(() => {
    if (!index.data || sessionKey !== null) return;
    const latest = index.data.latest_session_key;
    const season = index.data.seasons.find((s) => s.races.some((r) => r.session_key === latest)) ?? index.data.seasons[0];
    if (season) {
      setYear(season.year);
      setSessionKey(latest ?? season.races.find((r) => r.loaded)?.session_key ?? null);
    }
  }, [index.data, sessionKey]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Race Strategy Lab | Rukawa Analytics";
    return () => {
      document.title = previous;
    };
  }, []);

  const seasonRaces = useMemo(
    () => index.data?.seasons.find((s) => s.year === year)?.races.filter((r) => r.loaded) ?? [],
    [index.data, year],
  );
  const race = useRacingRace(sessionKey);

  const changeYear = (value: string) => {
    const y = Number(value);
    setYear(y);
    const races = index.data?.seasons.find((s) => s.year === y)?.races.filter((r) => r.loaded) ?? [];
    setSessionKey(races.length ? races[races.length - 1].session_key : null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main lang="en" className="mx-auto max-w-6xl px-5 sm:px-6">
        <header className="pt-12 sm:pt-16">
          <h1 className="text-base font-semibold text-foreground">Race Strategy Lab</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tyre strategy, tyre wear, race pace and pit stops for every Grand Prix since 2023, analysed automatically after
            each race.
          </p>

          {index.data && year !== null && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Select value={String(year)} onValueChange={changeYear}>
                <SelectTrigger className="w-28" aria-label="Season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {index.data.seasons.map((s) => (
                    <SelectItem key={s.year} value={String(s.year)}>
                      {s.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sessionKey !== null ? String(sessionKey) : undefined} onValueChange={(v) => setSessionKey(Number(v))}>
                <SelectTrigger className="w-72 max-w-full" aria-label="Race">
                  <SelectValue placeholder="Choose a race" />
                </SelectTrigger>
                <SelectContent>
                  {seasonRaces.map((r) => (
                    <SelectItem key={r.session_key} value={String(r.session_key)}>
                      {r.name ?? r.circuit}
                      {r.winner ? ` (${r.winner.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {(index.isLoading || race.isLoading) && (
          <div className="py-16" aria-busy="true">
            <div className="h-14 max-w-3xl animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            <div className="mt-10 h-96 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          </div>
        )}

        {(index.isError || race.isError) && (
          <div className="py-16">
            <p className="text-foreground">The race data could not be loaded.</p>
            <button
              type="button"
              onClick={() => (index.isError ? index.refetch() : race.refetch())}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Try again
            </button>
          </div>
        )}

        {index.data && !index.data.latest_session_key && (
          <p className="py-16 text-muted-foreground">The first races are still being analysed. Check back in a few minutes.</p>
        )}

        {race.data && (
          <div className="pt-2">
            <RaceView data={race.data} />
          </div>
        )}
        {year !== null && <SeasonView year={year} />}

        <section className="border-t border-border/60 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
          <ol className="mt-6 grid max-w-4xl gap-6 text-sm leading-relaxed text-muted-foreground sm:grid-cols-3">
            <li>
              <span className="block text-base font-medium text-foreground">1. Collect</span>
              A scheduled database job pulls laps, tyre stints, pit stops and results from the open OpenF1 API once a race
              is over.
            </li>
            <li>
              <span className="block text-base font-medium text-foreground">2. Clean</span>
              Out-laps, in-laps, the first lap and anything slower than 107 % of the race median (safety cars, spins) are
              removed. Lap times are corrected for fuel burn.
            </li>
            <li>
              <span className="block text-base font-medium text-foreground">3. Analyse</span>
              SQL fits a regression of lap time against tyre age for every stint, then aggregates wear, pace and pit stop
              times per race and season.
            </li>
          </ol>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Data:{" "}
            <a href="https://openf1.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              OpenF1
            </a>
            . Unofficial project, not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA
            FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V. The
            fuel correction is an estimate. Within a stint tyre age and fuel load change together, so the absolute wear
            figures move one-for-one with it; the differences between compounds don&apos;t.{" "}
            <Link to="/work/race-strategy-lab" className="underline underline-offset-2 hover:text-foreground">
              How I found that out
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RaceStrategy;
