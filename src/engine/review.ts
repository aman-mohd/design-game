import type {
  Consistency,
  DesignGraph,
  Level,
  SimulationResult,
  TrafficConfig,
} from '../data/types';
import { hasType } from '../lib/graph';
import { getTool } from '../data/tools';

export interface ReviewItem {
  title: string;
  detail: string;
}

export interface CapReview {
  recommended: Consistency;
  chosen: Consistency;
  matched: boolean;
  summary: string;
  consistencyPath: string;
  availabilityPath: string;
}

export interface DesignReview {
  /** Decisions that held the design back (from unresolved bottlenecks). */
  suboptimal: ReviewItem[];
  /** Helpful components the player left out. */
  missing: ReviewItem[];
  /** Good calls worth reinforcing. */
  strengths: ReviewItem[];
  /** CAP-theorem deep dive, when the level provides guidance. */
  cap?: CapReview;
}

const CONSISTENCY_LABEL: Record<Consistency, string> = {
  availability: 'Availability (AP)',
  balanced: 'Balanced',
  consistency: 'Consistency (CP)',
};

export function consistencyLabel(c: Consistency): string {
  return CONSISTENCY_LABEL[c];
}

/**
 * Turns the player's submitted design + the simulation result into a structured,
 * teachable review: what wasn't optimal, what was missing, what was good, and how
 * the "right" answer shifts under different CAP priorities.
 */
export function buildDesignReview(
  graph: DesignGraph,
  traffic: TrafficConfig,
  level: Level,
  result: SimulationResult,
): DesignReview {
  // Suboptimal: each unresolved finding, framed as a choice + a direction.
  const suboptimal: ReviewItem[] = result.findings.map((f) => ({
    title: f.title,
    // Pair the root cause with the strongest (final) directional hint.
    detail: `${f.why} ${f.hints[f.hints.length - 1] ?? ''}`.trim(),
  }));

  // Missing: ideal components for this level the player didn't use.
  const missing: ReviewItem[] = level.rubric.idealComponents
    .filter((t) => !hasType(graph, t))
    .map((t) => {
      const tool = getTool(t);
      return {
        title: tool?.name ?? t,
        detail: tool?.blurb ?? 'A component that fits this workload well.',
      };
    });

  // Strengths: ideal components the player did include.
  const strengths: ReviewItem[] = level.rubric.idealComponents
    .filter((t) => hasType(graph, t))
    .map((t) => {
      const tool = getTool(t);
      return {
        title: tool?.name ?? t,
        detail: tool?.blurb ?? 'A solid fit for this workload.',
      };
    });

  const cap: CapReview | undefined = level.cap
    ? {
        recommended: level.cap.recommended,
        chosen: traffic.consistency,
        matched: traffic.consistency === level.cap.recommended,
        summary: level.cap.summary,
        consistencyPath: level.cap.consistencyPath,
        availabilityPath: level.cap.availabilityPath,
      }
    : undefined;

  return { suboptimal, missing, strengths, cap };
}
