# 🦉 DesignQuest

A **Duolingo-styled game that teaches system design by doing.** You're given a
system to build, you drag real components onto a canvas, then you **send traffic**
and watch where it breaks. The game never just says "you lost" — it explains *why*
a bottleneck appears and nudges you in a direction (Socratic hints, not answers),
then grades your design like a friendly report card.

> The goal isn't winning. It's learning how real systems bend and break.

## How it plays

1. **Read the brief** (left panel) — functional & non-functional requirements.
2. **Build** (canvas) — drag components from the Toolbox and wire them together.
   Some nodes are pre-placed and locked (e.g. the Client) to get you started.
3. **Send traffic** (Traffic tab) — tune the real-world conditions:
   - Volume (req/s), read/write mix, payload size, latency target
   - Global traffic origins (multi-region)
   - CAP lean (availability ↔ consistency)
   - Traffic **spikes** and **chaos** (kill a node to test redundancy)
4. **Read the report** — bottlenecks are highlighted on the exact nodes, each with
   a plain-English *why* and tiered hints you reveal only if you want them.
5. **Fix & re-run** — address issues one at a time, then **submit** for a score,
   stars, XP, and "what to explore next" tips.

## Tech

- **Vite + React + TypeScript**, **React Flow** (`@xyflow/react`) for the canvas
- **Tailwind CSS** for the playful Duolingo look, **framer-motion** for juice
- **Zustand** (with `persist`) for state + local progress — no backend
- **Vitest** for the deterministic simulation engine

The bottleneck analysis is a **deterministic rules engine** (`src/engine/`): each
check is a pure function over `(graph, traffic, level)` returning findings. This
keeps the teaching predictable and runs entirely in the browser.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # engine unit tests + app smoke test
pnpm build      # type-check + production build
pnpm preview    # serve the production build
```

## Project layout

```
src/
  data/      types, tools catalog, level definitions
  engine/    simulate.ts + checks/ (compute, data, network, messaging,
             resilience, topology, overengineering), scoring.ts
  store/     gameStore.ts (Zustand, persisted progress)
  components/ layout, levelselect, game (canvas, panels, score card), ui
  lib/       graph helpers (adjacency, reachability)
```

## Adding a level

Levels are pure data — append to `src/data/levels.ts` with a brief, requirements,
pre-placed nodes, available tools, default traffic, and a scoring rubric. The
engine and UI are generic, so most new content needs no code changes.

Every level is grounded in [ByteByteGo / system-design-101](https://github.com/ByteByteGoHq/system-design-101)
and links back to the relevant topics from the requirements panel. See
[**LEVELS_ROADMAP.md**](./LEVELS_ROADMAP.md) for the wave-by-wave plan to turn the
whole repo into levels (rate limiter, notifications, chat, YouTube, payments,
stock exchange, and more).
