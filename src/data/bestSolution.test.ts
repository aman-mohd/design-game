import { describe, it, expect } from 'vitest';
import { LEVELS } from './levels';
import { getTool } from './tools';
import { simulate } from '../engine/simulate';
import { hasType } from '../lib/graph';
import type { DesignGraph } from './types';

describe('level best solutions', () => {
  for (const level of LEVELS) {
    describe(`Level ${level.id} — ${level.title}`, () => {
      const sol = level.bestSolution;

      it('has a reference solution', () => {
        expect(sol).toBeDefined();
      });

      if (!sol) return;

      it('only uses real component types', () => {
        for (const n of sol.nodes) {
          expect(getTool(n.type), `unknown tool: ${n.type}`).toBeDefined();
        }
      });

      it('has edges that reference existing nodes', () => {
        const ids = new Set(sol.nodes.map((n) => n.id));
        for (const e of sol.edges) {
          expect(ids.has(e.source), `missing source ${e.source}`).toBe(true);
          expect(ids.has(e.target), `missing target ${e.target}`).toBe(true);
        }
      });

      it('includes every ideal component for the level', () => {
        const graph: DesignGraph = { nodes: sol.nodes, edges: sol.edges };
        for (const t of level.rubric.idealComponents) {
          expect(hasType(graph, t), `solution is missing ideal component ${t}`).toBe(true);
        }
      });

      it('passes its own level with no bottlenecks at all', () => {
        const graph: DesignGraph = { nodes: sol.nodes, edges: sol.edges };
        const { findings } = simulate(graph, level.trafficDefaults, level);
        // A reference design should leave no findings at all (not just no criticals).
        expect(findings, JSON.stringify(findings.map((f) => f.id))).toHaveLength(0);
      });
    });
  }

  // Level 2's requirements are all graph-derivable (no CAP-slider requirement),
  // so its reference design must meet every one — this guards the new
  // wiring-aware media requirement (CDN must front the object storage).
  it('Level 2 reference design meets every requirement', () => {
    const level = LEVELS.find((l) => l.id === 2)!;
    const sol = level.bestSolution!;
    const graph: DesignGraph = { nodes: sol.nodes, edges: sol.edges };
    const { unmetRequirements } = simulate(graph, level.trafficDefaults, level);
    expect(unmetRequirements, JSON.stringify(unmetRequirements)).toHaveLength(0);
  });
});
