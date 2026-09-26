---
slug: race-strategy-lab
eyebrow: Motorsport data · outside my domain
title: A Tyre Model I Had to Distrust
summary: I don't follow Formula 1. I built a race strategy dashboard anyway, to see whether my way of working holds up in a domain where I can't tell a wrong number from a right one. The most useful result was finding out which of my numbers the data can't back up.
date: 2026-09-26
metric: 1 : 1
metricLabel: every 0.01 s of assumed fuel effect moves the tyre wear estimate by 0.01 s per lap
stats: 84 | races since 2023; 85 % | of laps clean enough to model; 0.036 s | more wear per lap on softs than hards (2025)
role: Build & analysis, as an outsider
stack: PostgreSQL, pg_cron, SQL, OpenF1, React
ogImage: /og/race-strategy.png
ctaLabel: Open Race Strategy Lab →
ctaHref: /race-strategy
---

## Why a sport I don't watch

In Clash Royale I know when a number is wrong before I can say why. If a deck shows a 70 % win rate against its hardest counter, I go looking for the bug. That instinct is most of what makes my esports analysis trustworthy, and it's also the part I can't show anyone.

So I picked a domain where I have no instinct at all: I don't follow Formula 1 and know next to nothing about it. I wanted to know what's left of my approach (collect, clean, analyse, decide) when I can't lean on knowing the game.

## What I could bring: the pipeline

That part transferred without trouble. [OpenF1](https://openf1.org) publishes lap times, tyre stints and pit stops for every race, for free. The whole pipeline runs inside Postgres, the same way as my electricity dashboard:

- A scheduled job (`pg_cron`) asks OpenF1 for new races every six hours and waits between requests, because the free tier allows 30 per minute.
- Raw data lands in six tables: races, drivers, laps, stints, pit stops and results. That's 84 races since March 2023 and 93,650 laps so far.
- Two SQL functions turn one race, or one season, into a finished JSON result that the page reads. No server, no API key, nothing to pay for.

None of this needed racing knowledge. It's the same shape as pulling battle logs.

## What I couldn't bring: the rules

Cleaning the data is where domain knowledge usually lives, and here I had none of my own. Every rule in the model is borrowed, and I can't check any of them myself:

- **Throw away laps that aren't racing.** The first lap, laps in and out of the pits, and anything slower than 107 % of the race's median lap. That last cut is how the model catches safety cars, spins and traffic. It keeps about 80,000 laps, roughly 85 %.
- **Correct for fuel.** A car burns fuel and gets lighter, so it gets faster every lap. The number I used is 0.06 s per lap. It's a rule of thumb, not a measurement.
- **Measure tyre wear as a slope.** For every stint (a run on one set of tyres) with at least six clean laps, fit a line through lap time against tyre age. The slope is how many seconds per lap the tyre loses as it gets older.

In esports I would have argued with each of these. Here all I could do was write them down as assumptions and say so on the dashboard.

## The result that looked wrong

The first season summary said hard tyres get *faster* as they age: −0.010 s per lap in 2025. Soft and medium tyres got slower, as I expected. The hard tyres went the other way.

With Clash Royale data I would have known immediately whether that was a bug or a real effect. Here I didn't. There are a few stories that could explain it: the track gathers grip over a race, drivers save their tyres early and push later, or the fuel number is simply too small. I can't judge which one is right. So instead of picking the story I liked, I tested the one assumption I could vary.

## Why the data can't settle it

I recalculated the 2025 tyre wear with four different fuel corrections:

| Fuel effect assumed | Soft | Medium | Hard |
|---|---|---|---|
| none | −0.034 | −0.039 | −0.070 |
| 0.03 s per lap | −0.004 | −0.009 | −0.040 |
| **0.06 s per lap (used)** | **+0.026** | **+0.021** | **−0.010** |
| 0.09 s per lap | +0.056 | +0.051 | +0.020 |

*Average wear in seconds per lap, per compound, over the 2025 races with enough clean stints.*

Every column moves by exactly the change in the assumption. That's not a coincidence, it's arithmetic. Within a stint, the tyre gets one lap older each lap, and the car carries one lap less fuel each lap. The two move in lockstep, so a line through lap time against tyre age can't tell them apart. Whatever the fuel does, the regression hands it to the tyre.

In plain terms: **from lap times alone, I can't say how fast a tyre wears.** The number on the dashboard is the fuel assumption plus something. A racing engineer probably knows this. I had to find it in the data, and I think that's the part of the project worth showing.

## What survives

One thing doesn't depend on the fuel number at all: the *difference* between compounds. The fuel correction shifts all three by the same amount, so the gaps stay put in every row of the table:

- Softs lose **0.036 s per lap more** than hards.
- Mediums lose **0.031 s per lap more** than hards.

That's a claim I'm willing to make, because it holds whatever the right fuel number turns out to be. It's also the comparison a strategy decision actually needs: whether to take the faster, shorter-lived tyre or the slower, longer-lived one.

## What I didn't publish as a finding

Not knowing the sport also means knowing when to stay quiet:

- **Montreal 2025** shows more than four pit stops per driver. I don't know that race. It could be rain, a red flag or a data problem, and I can't tell which. It's on the dashboard as data, not in this write-up as a result.
- **Intermediate tyres** (for a wet track) seem to get 0.275 s per lap *faster* with age. That's from two races, and my guess would be a drying track, but it's a guess. Two races aren't enough for more.

## What this taught me

- **The pipeline transfers, judgement doesn't.** Getting clean data flowing was the easy part. Knowing which numbers to trust is the actual work, and it doesn't come with the data.
- **If you can't judge a result, vary the assumption behind it.** I couldn't tell whether −0.010 s was right. I could tell that it moved one-for-one with a number I'd made up, and that was enough to know how far to trust it.
- **Report differences when levels are uncertain.** The level of tyre wear depends on an assumption. The gap between compounds doesn't. That habit carries back to esports: comparing two decks against the same opponents says more than either raw win rate.

The next step would be to measure the fuel effect instead of assuming it, for example from the same tyre across different stages of the race. That would take someone who knows the sport, and I'd rather ask than guess.

*Unofficial project, not associated with the Formula 1 companies. Data from OpenF1.*
