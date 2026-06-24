import type {
  DesignGraph,
  Finding,
  Level,
  Requirement,
  SimulationResult,
  TrafficConfig,
} from '../data/types';
import {
  hasAnyDataStore,
  hasType,
  reachableFromClient,
  DATA_STORE_TYPES,
} from '../lib/graph';
import { topologyChecks } from './checks/topology';
import { computeChecks } from './checks/compute';
import { dataChecks } from './checks/data';
import { networkChecks } from './checks/network';
import { messagingChecks } from './checks/messaging';
import { resilienceChecks } from './checks/resilience';
import { overengineeringChecks } from './checks/overengineering';

type Check = (graph: DesignGraph, traffic: TrafficConfig, level: Level) => Finding[];

const CHECKS: Check[] = [
  topologyChecks,
  computeChecks,
  dataChecks,
  networkChecks,
  messagingChecks,
  resilienceChecks,
  overengineeringChecks,
];

const SEVERITY_RANK = { critical: 0, warn: 1, info: 2 } as const;

/** Run every check and return de-duplicated, severity-sorted findings. */
export function simulate(
  graph: DesignGraph,
  traffic: TrafficConfig,
  level: Level,
): SimulationResult {
  const seen = new Set<string>();
  const findings: Finding[] = [];
  for (const check of CHECKS) {
    for (const f of check(graph, traffic, level)) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      findings.push(f);
    }
  }
  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const { metRequirements, unmetRequirements } = evaluateRequirements(
    graph,
    traffic,
    level,
  );

  return { findings, metRequirements, unmetRequirements };
}

/**
 * Map each level requirement to a structural predicate. Kept deliberately
 * simple & deterministic — the teaching nuance lives in the findings.
 */
export function evaluateRequirements(
  graph: DesignGraph,
  traffic: TrafficConfig,
  level: Level,
): { metRequirements: string[]; unmetRequirements: string[] } {
  const met: string[] = [];
  const unmet: string[] = [];

  const all: Requirement[] = [
    ...level.functionalRequirements,
    ...level.nonFunctionalRequirements,
  ];

  for (const req of all) {
    if (requirementSatisfied(req, graph, traffic, level)) met.push(req.id);
    else unmet.push(req.id);
  }
  return { metRequirements: met, unmetRequirements: unmet };
}

function requirementSatisfied(
  req: Requirement,
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): boolean {
  const dataReachable = DATA_STORE_TYPES.some((t) => reachableFromClient(graph, t));
  const global = traffic.regions.length > 1;

  switch (req.id) {
    // Persistence-style requirements: need a reachable data store.
    case 'n1':
      // Level 1: durable storage. Level 2/3 n1 differ; handled generically below.
      return hasAnyDataStore(graph) && dataReachable;
    default:
      break;
  }

  // Generic heuristics by requirement text keywords.
  const t = req.text.toLowerCase();
  if (t.includes('store') || t.includes('persist') || t.includes('storage')) {
    return hasAnyDataStore(graph) && dataReachable;
  }
  if (t.includes('image') || t.includes('media') || t.includes('photo')) {
    return hasType(graph, 'object_storage') || hasType(graph, 'cdn');
  }
  if (t.includes('spike') || t.includes('flash') || t.includes('crowd')) {
    return hasType(graph, 'load_balancer') || hasType(graph, 'autoscaler') || hasType(graph, 'cache');
  }
  if (t.includes('single point of failure') || t.includes('available')) {
    return hasType(graph, 'load_balancer') || hasType(graph, 'read_replica') || hasType(graph, 'autoscaler');
  }
  if (t.includes('latency') || t.includes('low latency')) {
    return hasType(graph, 'cdn') || hasType(graph, 'cache');
  }
  if (t.includes('region') && (t.includes('offline') || t.includes('survive'))) {
    return (hasType(graph, 'cdn') || hasType(graph, 'dns')) && hasType(graph, 'read_replica');
  }
  if (t.includes('consistency') && t.includes('availability')) {
    // A deliberate, non-default CAP choice counts as engaging with the trade-off.
    return global ? traffic.consistency !== 'balanced' : true;
  }
  if (t.includes('redirect') || t.includes('short link') || t.includes('serve') || t.includes('update') || t.includes('read')) {
    // Core functional path: client → app → data is wired.
    return dataReachable;
  }
  return dataReachable; // safe default: the basic request path works.
}
