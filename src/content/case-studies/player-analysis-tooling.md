---
slug: player-analysis-tooling
eyebrow: Featured system
title: From Battle Log to Set Decision
summary: Why I built a private analysis platform instead of doing prep by hand - and the decisions that made it actually trustworthy under set pressure.
date: 2026-09-18
metric: 1,000
metricLabel: recent battles aggregated per player
stats: Up to 5 | duel slots profiled separately; 8 | cards hashed into one deck identity
role: Design, build & analysis
stack: React, TypeScript, Supabase, Postgres
---

## The problem

Before a set, prep used to mean the same manual routine every time: pull a player's recent battles by hand, scroll through them for patterns, and try to hold deck tendencies in your head while the clock is running. It worked, but it didn't scale past one player at a time, and it fell apart exactly when it mattered most - mid-set, under time pressure. This was around 2021 and I was still with a relatively small German semi-pro team.

## Taming the raw battle log

The first major step was replacing manual scrolling with an automated aggregation engine. The system pulls up to 1,000 recent battles for a targeted player, handling everything from standard ladder matches to complex multi-round Duels (`quadDeckPick`) and fragmented CRL tournament logs. By grouping rounds into unified sets and generating unique cryptographic hashes for every 8-card array, the app instantly organizes thousands of chaotic logs into a clean, chronological catalog of a player's true arsenal.

## Temporal tendencies and clutch metrics

A player’s strategy changes depending on the state of the set. To capture this, the analysis engine strictly separates win conditions, spells, and Evolution pairs by their "Duel Slot" (Game 1, Game 2, or Game 3). Does an opponent reliably open G1 with Miner Poison? Do they save a specific Evo combination for match point? The system tracks these slot-based usage rates alongside psychological metrics-like their "Clutch Win Rate" (performance when facing elimination) and history of Reverse Sweeps-creating a behavioral profile rather than just a spreadsheet of average win rates.

## Predicting the remaining board

The ultimate goal of tracking Game 1 and Game 2 habits is anticipating Game 3. The platform feeds all these historical slot tendencies into a "Remaining Advisor" dashboard. As a live set unfolds, the system automatically removes used cards from the opponent's historical pool and calculates the statistical probability of what they will play next based on their past duels. What used to be a frantic, memory-based guessing game is now a structured, repeatable pipeline—delivering actionable remaining-deck predictions before the final pick phase even begins.
