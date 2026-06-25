import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  DesignEdge,
  DesignGraph,
  DesignNode,
  Level,
  ScoreBreakdown,
  SimulationResult,
  TrafficConfig,
} from '../data/types';
import { getLevel, LEVELS } from '../data/levels';
import { getTool } from '../data/tools';
import { simulate } from '../engine/simulate';
import { scoreDesign } from '../engine/scoring';

type View = 'map' | 'game';

interface LevelProgress {
  completed: boolean;
  bestStars: number;
  bestScore: number;
}

interface PersistedState {
  xp: number;
  streak: number;
  progress: Record<number, LevelProgress>;
}

interface GameState extends PersistedState {
  // ── Navigation ──
  view: View;
  currentLevelId: number | null;

  // ── Active design ──
  graph: DesignGraph;
  traffic: TrafficConfig;
  result: SimulationResult | null; // last simulation
  score: ScoreBreakdown | null; // set when the player submits
  hasRunOnce: boolean;

  // ── Actions ──
  goToMap: () => void;
  startLevel: (id: number) => void;
  addNode: (type: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  connect: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  setTraffic: (patch: Partial<TrafficConfig>) => void;
  runSimulation: () => void;
  submitDesign: () => ScoreBreakdown | null;
}

let nodeSeq = 1;
const newId = (type: string) => `${type}-${nodeSeq++}-${Math.random().toString(36).slice(2, 6)}`;

function buildInitialGraph(levelId: number): DesignGraph {
  const level = getLevel(levelId);
  if (!level) return { nodes: [], edges: [] };
  const nodes: DesignNode[] = level.prePlacedNodes.map((n) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    x: n.x,
    y: n.y,
    locked: n.locked,
  }));
  const edges: DesignEdge[] = (level.prePlacedEdges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
  return { nodes, edges };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      // persisted
      xp: 0,
      streak: 1,
      progress: {},

      // session
      view: 'map',
      currentLevelId: null,
      graph: { nodes: [], edges: [] },
      traffic: LEVELS[0].trafficDefaults,
      result: null,
      score: null,
      hasRunOnce: false,

      goToMap: () => set({ view: 'map', currentLevelId: null }),

      startLevel: (id) => {
        const level = getLevel(id);
        if (!level) return;
        set({
          view: 'game',
          currentLevelId: id,
          graph: buildInitialGraph(id),
          traffic: clampTraffic({ ...level.trafficDefaults }, level),
          result: null,
          score: null,
          hasRunOnce: false,
        });
      },

      addNode: (type, x, y) => {
        const tool = getTool(type);
        if (!tool) return;
        const node: DesignNode = { id: newId(type), type, label: tool.name, x, y };
        set((s) => ({ graph: { ...s.graph, nodes: [...s.graph.nodes, node] }, score: null }));
      },

      removeNode: (id) =>
        set((s) => {
          const node = s.graph.nodes.find((n) => n.id === id);
          if (!node || node.locked) return s;
          return {
            graph: {
              nodes: s.graph.nodes.filter((n) => n.id !== id),
              edges: s.graph.edges.filter((e) => e.source !== id && e.target !== id),
            },
            score: null,
          };
        }),

      moveNode: (id, x, y) =>
        set((s) => ({
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
          },
        })),

      connect: (source, target) =>
        set((s) => {
          if (source === target) return s;
          const exists = s.graph.edges.some(
            (e) =>
              (e.source === source && e.target === target) ||
              (e.source === target && e.target === source),
          );
          if (exists) return s;
          const edge: DesignEdge = { id: `e-${source}-${target}`, source, target };
          return { graph: { ...s.graph, edges: [...s.graph.edges, edge] }, score: null };
        }),

      removeEdge: (id) =>
        set((s) => ({
          graph: { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== id) },
          score: null,
        })),

      setTraffic: (patch) =>
        set((s) => {
          const level = s.currentLevelId ? getLevel(s.currentLevelId) : null;
          const merged = { ...s.traffic, ...patch };
          return { traffic: level ? clampTraffic(merged, level) : merged, score: null };
        }),

      runSimulation: () => {
        const { graph, traffic, currentLevelId } = get();
        const level = currentLevelId ? getLevel(currentLevelId) : null;
        if (!level) return;
        const result = simulate(graph, traffic, level);
        set({ result, hasRunOnce: true });
      },

      submitDesign: () => {
        const { graph, traffic, currentLevelId } = get();
        const level = currentLevelId ? getLevel(currentLevelId) : null;
        if (!level) return null;
        const result = simulate(graph, traffic, level);
        const score = scoreDesign(graph, traffic, level, result);

        set((s) => {
          const prev = s.progress[level.id];
          const merged: LevelProgress = {
            completed: true,
            bestStars: Math.max(prev?.bestStars ?? 0, score.stars),
            bestScore: Math.max(prev?.bestScore ?? 0, score.total),
          };
          // Award XP only for net improvement (avoid farming the same level).
          const gained = Math.max(0, score.total - (prev?.bestScore ?? 0));
          const xpGain = prev ? Math.round((gained / 100) * score.xp) : score.xp;
          return {
            result,
            score,
            progress: { ...s.progress, [level.id]: merged },
            xp: s.xp + xpGain,
          };
        });
        return score;
      },
    }),
    {
      name: 'designquest-progress',
      storage: createJSONStorage(safeStorage),
      partialize: (s): PersistedState => ({
        xp: s.xp,
        streak: s.streak,
        progress: s.progress,
      }),
    },
  ),
);

/**
 * Returns localStorage when it's actually writable, otherwise an in-memory
 * fallback. Guards against Safari private mode, sandboxed iframes, and test
 * runners where `localStorage` exists but throws on write.
 */
function safeStorage(): Storage {
  try {
    const probe = '__designquest_probe__';
    globalThis.localStorage.setItem(probe, probe);
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k, v) => void mem.set(k, String(v)),
      removeItem: (k) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i) => Array.from(mem.keys())[i] ?? null,
      get length() {
        return mem.size;
      },
    } as Storage;
  }
}

/**
 * Force a traffic config into a level's allowed envelope so the player can never
 * dial in a scenario the level's toolbox can't resolve (e.g. huge payloads or
 * multi-region on the URL-shortener level). Mirrors the bounds the TrafficPanel
 * enforces in the UI, and guards persisted/edge-case values.
 */
export function clampTraffic(traffic: TrafficConfig, level: Level): TrafficConfig {
  const c = level.trafficConstraints;
  if (!c) return traffic;

  const clampNum = (n: number, lo?: number, hi?: number) =>
    Math.max(lo ?? -Infinity, Math.min(hi ?? Infinity, n));

  let regions = traffic.regions;
  if (c.singleRegion) {
    regions = regions.slice(0, 1);
  } else if (c.allowedRegions) {
    regions = regions.filter((r) => c.allowedRegions!.includes(r));
    if (regions.length === 0) regions = traffic.regions.slice(0, 1);
  }

  return {
    ...traffic,
    rps: clampNum(traffic.rps, c.rpsMin, c.rpsMax),
    payloadKb: clampNum(traffic.payloadKb, c.payloadMinKb, c.payloadMaxKb),
    latencySlaMs: clampNum(traffic.latencySlaMs, c.latencyMinMs, c.latencyMaxMs),
    spike: c.allowSpike === false ? false : traffic.spike,
    failureInjection: c.allowChaos === false ? false : traffic.failureInjection,
    regions,
  };
}

/** A level is unlocked if it's the first, or the previous one is completed. */
export function isLevelUnlocked(levelId: number, progress: Record<number, LevelProgress>): boolean {
  if (levelId <= LEVELS[0].id) return true;
  return Boolean(progress[levelId - 1]?.completed);
}
