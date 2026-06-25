// ── Shared domain types for DesignQuest ──────────────────────────────────────

export type ToolCategory = 'compute' | 'network' | 'data' | 'messaging' | 'client';

/** A placeable piece of technology shown in the tools drawer. */
export interface Tool {
  id: string; // stable type id, e.g. "cache", "load_balancer"
  name: string;
  category: ToolCategory;
  icon: string; // lucide-react icon name
  blurb: string; // one-line "what it does", shown on hover
}

/** A node placed on the design canvas. `type` references a Tool.id. */
export interface DesignNode {
  id: string; // unique instance id on the canvas
  type: string; // Tool.id
  label: string;
  x: number;
  y: number;
  locked?: boolean; // pre-placed, cannot be deleted
}

export interface DesignEdge {
  id: string;
  source: string; // DesignNode.id
  target: string; // DesignNode.id
}

export interface DesignGraph {
  nodes: DesignNode[];
  edges: DesignEdge[];
}

// ── Traffic configuration (the "send traffic" knobs) ─────────────────────────

export type Consistency = 'availability' | 'balanced' | 'consistency';

export interface TrafficConfig {
  /** Requests per second the system must handle. */
  rps: number;
  /** Active regions sending traffic. >1 means global. */
  regions: string[];
  /** CAP lean. */
  consistency: Consistency;
  /** 0..100 — share of traffic that is reads (rest are writes). */
  readPercent: number;
  /** Steady vs bursty traffic. */
  spike: boolean;
  /** Average payload size in KB (large => media heavy). */
  payloadKb: number;
  /** Target p99 latency in ms the design should meet. */
  latencySlaMs: number;
  /** Chaos: simulate a node/region failure to test redundancy. */
  failureInjection: boolean;
}

export const ALL_REGIONS = [
  'N. America',
  'Europe',
  'Asia',
  'S. America',
  'Africa',
  'Oceania',
] as const;

/**
 * Per-level bounds & visibility for the traffic knobs, so a level can never
 * present a scenario the player can't resolve with its toolbox. All fields are
 * optional; unset means "full range / visible".
 */
export interface TrafficConstraints {
  rpsMin?: number;
  rpsMax?: number;
  payloadMinKb?: number;
  payloadMaxKb?: number;
  latencyMinMs?: number;
  latencyMaxMs?: number;
  /** Force a single region (hide the multi-region toggles). */
  singleRegion?: boolean;
  /** Subset of ALL_REGIONS offered when multi-region is allowed. */
  allowedRegions?: string[];
  /** Show the traffic-spike toggle. Default true. */
  allowSpike?: boolean;
  /** Show the chaos / failure-injection toggle. Default true. */
  allowChaos?: boolean;
}

// ── Simulation output ────────────────────────────────────────────────────────

export type Severity = 'critical' | 'warn' | 'info';

/** A single bottleneck / issue surfaced by the engine. */
export interface Finding {
  id: string; // stable id for de-duping & resolution tracking
  category: ToolCategory | 'resilience' | 'cost';
  severity: Severity;
  nodeIds: string[]; // canvas nodes to highlight
  title: string;
  why: string; // explanation of the root cause
  hints: string[]; // tiered Socratic nudges (reveal one at a time)
}

export interface SimulationResult {
  findings: Finding[];
  /** ids of requirement checks that passed. */
  metRequirements: string[];
  unmetRequirements: string[];
}

// ── Levels ───────────────────────────────────────────────────────────────────

export interface Requirement {
  id: string;
  text: string;
  kind: 'functional' | 'nonfunctional';
}

/** A pre-placed node baked into the level. */
export interface PrePlacedNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  locked?: boolean;
}

/** A reference "best" architecture shown after submission. */
export interface SolutionGraph {
  nodes: PrePlacedNode[];
  edges: { id: string; source: string; target: string }[];
  /** Short note on why this is a strong design. */
  rationale?: string;
}

export interface Rubric {
  /** node types whose presence is "ideal" for this level. */
  idealComponents: string[];
  /** what a great design unlocks, used for scoring weights. */
  weights: {
    correctness: number; // resolving findings
    requirements: number; // meeting requirements
    efficiency: number; // not over-engineering
  };
  /** number of nodes beyond which we suspect over-engineering for this level. */
  complexityBudget: number;
}

/**
 * Curated CAP-theorem guidance for a level: which way the system should lean and
 * how the architecture changes under each priority. Powers the post-submit
 * design review so players see how different requirements lead to different
 * "right" answers.
 */
export interface CapGuidance {
  /** The lean this system should take, and why scoring nudges toward it. */
  recommended: Consistency;
  summary: string;
  /** What the design emphasises if you prioritise strong consistency (CP). */
  consistencyPath: string;
  /** What the design emphasises if you prioritise availability (AP). */
  availabilityPath: string;
}

export interface Level {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  brief: string; // narrative shown by the mascot
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  prePlacedNodes: PrePlacedNode[];
  prePlacedEdges?: { id: string; source: string; target: string }[];
  availableToolIds: string[];
  trafficDefaults: TrafficConfig;
  /** Per-level bounds & visibility for the traffic knobs. */
  trafficConstraints?: TrafficConstraints;
  /** CAP-theorem guidance shown in the post-submit review. */
  cap?: CapGuidance;
  /** A reference architecture revealed by the "Show best solution" button. */
  bestSolution?: SolutionGraph;
  rubric: Rubric;
  /** Source material this level is grounded in (e.g. ByteByteGo topics). */
  references?: { label: string; url: string }[];
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  total: number; // 0..100
  correctness: number; // 0..100
  requirements: number; // 0..100
  efficiency: number; // 0..100
  xp: number;
  stars: number; // 0..3
  tips: string[]; // "what you could've done better"
}
