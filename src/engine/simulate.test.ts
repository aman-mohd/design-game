import { describe, it, expect } from 'vitest';
import { simulate } from './simulate';
import { scoreDesign } from './scoring';
import { getLevel } from '../data/levels';
import type { DesignGraph, TrafficConfig, Level } from '../data/types';

const L1 = getLevel(1) as Level;

function graph(
  nodes: Array<{ id: string; type: string; locked?: boolean }>,
  edges: Array<[string, string]>,
): DesignGraph {
  return {
    nodes: nodes.map((n, i) => ({
      id: n.id,
      type: n.type,
      label: n.type,
      x: i * 100,
      y: 0,
      locked: n.locked,
    })),
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, source, target })),
  };
}

const baseTraffic: TrafficConfig = { ...L1.trafficDefaults };

function hasFinding(g: DesignGraph, t: TrafficConfig, id: string, level = L1) {
  return simulate(g, t, level).findings.some((f) => f.id === id);
}

describe('topology checks', () => {
  it('flags a design with no data store', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
      ],
      [['c', 'a']],
    );
    expect(hasFinding(g, baseTraffic, 'topo-no-datastore')).toBe(true);
  });

  it('does not flag missing data store once one is wired in', () => {
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
    expect(hasFinding(g, baseTraffic, 'topo-no-datastore')).toBe(false);
  });

  it('flags a client wired straight to a database', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a'],
        ['c', 'db'],
      ],
    );
    expect(hasFinding(g, baseTraffic, 'topo-client-to-db')).toBe(true);
  });

  it('flags an orphan node', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
        { id: 'lonely', type: 'cache' },
      ],
      [
        ['c', 'a'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, baseTraffic, 'topo-orphans')).toBe(true);
  });
});

describe('compute checks', () => {
  it('flags a single server under high RPS with no load balancer', () => {
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
    expect(hasFinding(g, { ...baseTraffic, rps: 20000 }, 'compute-single-server')).toBe(true);
  });

  it('clears the single-server finding once a load balancer is added', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'lb', type: 'load_balancer' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'lb'],
        ['lb', 'a'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, { ...baseTraffic, rps: 20000 }, 'compute-single-server')).toBe(false);
  });

  it('flags multiple servers with no load balancer', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a1', type: 'app_server' },
        { id: 'a2', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a1'],
        ['c', 'a2'],
        ['a1', 'db'],
        ['a2', 'db'],
      ],
    );
    expect(hasFinding(g, baseTraffic, 'compute-no-lb')).toBe(true);
  });
});

describe('data checks', () => {
  const heavy: TrafficConfig = { ...baseTraffic, rps: 20000, readPercent: 95 };

  it('flags read-heavy high traffic with no cache', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'lb', type: 'load_balancer' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'lb'],
        ['lb', 'a'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, heavy, 'data-no-cache')).toBe(true);
  });

  it('clears the no-cache finding once a cache is added', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'lb', type: 'load_balancer' },
        { id: 'a', type: 'app_server' },
        { id: 'cache', type: 'cache' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'lb'],
        ['lb', 'a'],
        ['a', 'cache'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, heavy, 'data-no-cache')).toBe(false);
  });

  it('flags the CAP trade-off when forcing strong consistency across regions', () => {
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
    const t: TrafficConfig = {
      ...baseTraffic,
      consistency: 'consistency',
      regions: ['N. America', 'Europe'],
    };
    expect(hasFinding(g, t, 'data-cap-tradeoff')).toBe(true);
  });
});

describe('network checks', () => {
  it('flags global traffic with no CDN', () => {
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
    const t: TrafficConfig = { ...baseTraffic, regions: ['N. America', 'Asia'] };
    expect(hasFinding(g, t, 'net-no-cdn-global')).toBe(true);
  });
});

describe('resilience checks (chaos)', () => {
  const chaos: TrafficConfig = { ...baseTraffic, failureInjection: true };

  it('flags a single-server SPOF under failure injection', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
        { id: 'r', type: 'read_replica' },
      ],
      [
        ['c', 'a'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, chaos, 'res-compute-spof')).toBe(true);
  });

  it('does not run resilience checks without failure injection', () => {
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
    expect(hasFinding(g, baseTraffic, 'res-compute-spof')).toBe(false);
  });
});

describe('over-engineering checks', () => {
  it('flags a queue on a tiny steady workload', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
        { id: 'q', type: 'message_queue' },
      ],
      [
        ['c', 'a'],
        ['a', 'q'],
        ['a', 'db'],
      ],
    );
    expect(hasFinding(g, { ...baseTraffic, rps: 1000, spike: false }, 'cost-premature-async')).toBe(true);
  });

  it('flags going well over the complexity budget', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, type: 'app_server' }));
    const g = graph(
      [{ id: 'c', type: 'client' }, { id: 'db', type: 'sql_db' }, ...many],
      [['c', 'n0'], ['n0', 'db']],
    );
    expect(hasFinding(g, baseTraffic, 'cost-too-many')).toBe(true);
  });
});

describe('scoring', () => {
  it('rewards a sensible Level 1 design over a bare one', () => {
    const bare = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
      ],
      [['c', 'a']],
    );
    const good = graph(
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
    const bareScore = scoreDesign(bare, baseTraffic, L1, simulate(bare, baseTraffic, L1));
    const goodScore = scoreDesign(good, baseTraffic, L1, simulate(good, baseTraffic, L1));
    expect(goodScore.total).toBeGreaterThan(bareScore.total);
    expect(goodScore.total).toBeLessThanOrEqual(100);
    expect(bareScore.total).toBeGreaterThanOrEqual(0);
  });
});
