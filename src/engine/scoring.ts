import type {
  DesignGraph,
  Level,
  ScoreBreakdown,
  SimulationResult,
  TrafficConfig,
} from '../data/types';
import { hasType } from '../lib/graph';

const SEVERITY_PENALTY = { critical: 34, warn: 14, info: 4 } as const;

/**
 * Turn a simulation result into an encouraging "report card".
 * Three sub-scores (correctness, requirements, efficiency) combine via the
 * level's rubric weights. Never punitive to the point of zero — this is a
 * learning game, not a pass/fail exam.
 */
export function scoreDesign(
  graph: DesignGraph,
  _traffic: TrafficConfig,
  level: Level,
  result: SimulationResult,
): ScoreBreakdown {
  // ── Correctness: start at 100, subtract per unresolved finding. ──
  let correctness = 100;
  for (const f of result.findings) correctness -= SEVERITY_PENALTY[f.severity];
  correctness = clamp(correctness);

  // ── Requirements: share of level requirements met. ──
  const totalReqs =
    level.functionalRequirements.length + level.nonFunctionalRequirements.length;
  const requirements =
    totalReqs === 0
      ? 100
      : Math.round((result.metRequirements.length / totalReqs) * 100);

  // ── Efficiency: ideal coverage minus over-engineering. ──
  const efficiency = scoreEfficiency(graph, level);

  const w = level.rubric.weights;
  const total = clamp(
    Math.round(
      correctness * w.correctness +
        requirements * w.requirements +
        efficiency * w.efficiency,
    ),
  );

  const stars = total >= 90 ? 3 : total >= 70 ? 2 : total >= 45 ? 1 : 0;
  const xp = 20 + stars * 20 + Math.round(total / 5);

  return {
    total,
    correctness,
    requirements,
    efficiency,
    xp,
    stars,
    tips: buildTips(result, graph, level),
  };
}

function scoreEfficiency(graph: DesignGraph, level: Level): number {
  const ideal = level.rubric.idealComponents;
  const coverage =
    ideal.length === 0
      ? 1
      : ideal.filter((t) => hasType(graph, t)).length / ideal.length;

  // Penalise going over the complexity budget.
  const placed = graph.nodes.filter((n) => !n.locked).length;
  const over = Math.max(0, placed - level.rubric.complexityBudget);
  const overPenalty = Math.min(40, over * 10);

  return clamp(Math.round(coverage * 100) - overPenalty);
}

/** 2–4 "what you could've done better" tips: unresolved findings + missing ideals. */
function buildTips(
  result: SimulationResult,
  graph: DesignGraph,
  level: Level,
): string[] {
  const tips: string[] = [];

  // Strongest unresolved findings first (their final, most direct hint).
  for (const f of result.findings) {
    tips.push(`${f.title}: ${f.hints[f.hints.length - 1]}`);
    if (tips.length >= 3) break;
  }

  // Mention ideal components the player skipped, if we have room.
  if (tips.length < 4) {
    const missing = level.rubric.idealComponents.filter((t) => !hasType(graph, t));
    if (missing.length > 0) {
      tips.push(
        `Designs that scale well here often include: ${missing.join(', ')}. Consider why each helps.`,
      );
    }
  }

  if (tips.length === 0) {
    tips.push('Clean design! Try a harder traffic profile to stress-test your choices.');
  }
  return tips.slice(0, 4);
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}
