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
