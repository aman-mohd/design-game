import { describe, it, expect } from 'vitest';
import { buildDesignReview } from './review';
import { simulate } from './simulate';
import { getLevel } from '../data/levels';
import type { DesignGraph, Level, TrafficConfig } from '../data/types';

const L1 = getLevel(1) as Level;

function graph(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<[string, string]>,
): DesignGraph {
  return {
    nodes: nodes.map((n, i) => ({ id: n.id, type: n.type, label: n.type, x: i * 100, y: 0 })),
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, source, target })),
  };
}

const baseTraffic: TrafficConfig = { ...L1.trafficDefaults };

describe('buildDesignReview', () => {
  it('lists unresolved bottlenecks as suboptimal choices', () => {
    // Client → App with no data store: a clear bottleneck.
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
      ],
      [['c', 'a']],
    );
    const review = buildDesignReview(g, baseTraffic, L1, simulate(g, baseTraffic, L1));
    expect(review.suboptimal.length).toBeGreaterThan(0);
    expect(review.suboptimal.some((r) => /store/i.test(r.title))).toBe(true);
  });

  it('reports ideal components that were left out, then clears them when added', () => {
    const bare = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a'],
        ['a', 'db'],
      ],
    );
    const bareReview = buildDesignReview(bare, baseTraffic, L1, simulate(bare, baseTraffic, L1));
    // L1 ideal components include a cache, which is missing here.
    expect(bareReview.missing.some((m) => /cache/i.test(m.title))).toBe(true);

    const withCache = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'cache', type: 'cache' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a'],
        ['a', 'cache'],
        ['a', 'db'],
      ],
    );
    const goodReview = buildDesignReview(withCache, baseTraffic, L1, simulate(withCache, baseTraffic, L1));
    expect(goodReview.missing.some((m) => /cache/i.test(m.title))).toBe(false);
    expect(goodReview.strengths.some((s) => /cache/i.test(s.title))).toBe(true);
  });

  it('surfaces CAP guidance and flags whether the choice matched the recommendation', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a'],
        ['a', 'db'],
      ],
    );

    const apReview = buildDesignReview(
      g,
      { ...baseTraffic, consistency: 'availability' },
      L1,
      simulate(g, baseTraffic, L1),
    );
    expect(apReview.cap).toBeDefined();
    expect(apReview.cap!.recommended).toBe('availability');
    expect(apReview.cap!.matched).toBe(true);
    expect(apReview.cap!.consistencyPath.length).toBeGreaterThan(0);
    expect(apReview.cap!.availabilityPath.length).toBeGreaterThan(0);

    const cpReview = buildDesignReview(
      g,
      { ...baseTraffic, consistency: 'consistency' },
      L1,
      simulate(g, baseTraffic, L1),
    );
    expect(cpReview.cap!.matched).toBe(false);
  });
});
