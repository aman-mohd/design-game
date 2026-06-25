import { describe, it, expect } from 'vitest';
import { simulate } from '../simulate';
import { getLevel } from '../../data/levels';
import type { DesignGraph, Level } from '../../data/types';

function graph(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<[string, string]>,
): DesignGraph {
  return {
    nodes: nodes.map((n, i) => ({ id: n.id, type: n.type, label: n.type, x: i * 100, y: 0 })),
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, source, target })),
  };
}

const fires = (level: Level, g: DesignGraph, id: string) =>
  simulate(g, level.trafficDefaults, level).findings.some((f) => f.id === id);

describe('domain checks — rate limiting (Level 4)', () => {
  const level = getLevel(4) as Level;
  const base: Array<{ id: string; type: string }> = [
    { id: 'c', type: 'client' },
    { id: 'a', type: 'app_server' },
    { id: 'db', type: 'sql_db' },
  ];
  const wires: Array<[string, string]> = [
    ['c', 'a'],
    ['a', 'db'],
  ];

  it('flags a public API with no gateway', () => {
    expect(fires(level, graph(base, wires), 'api-no-gateway')).toBe(true);
  });

  it('clears once an API gateway fronts the app', () => {
    const g = graph(
      [...base, { id: 'gw', type: 'api_gateway' }],
      [['c', 'gw'], ['gw', 'a'], ['a', 'db']],
    );
    expect(fires(level, g, 'api-no-gateway')).toBe(false);
  });
});

describe('domain checks — search (Level 6)', () => {
  const level = getLevel(6) as Level;

  it('flags text search with no search index', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'nosql_db' },
      ],
      [['c', 'a'], ['a', 'db']],
    );
    expect(fires(level, g, 'search-no-index')).toBe(true);
  });

  it('clears once a search index is added', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'idx', type: 'search_index' },
        { id: 'db', type: 'nosql_db' },
      ],
      [['c', 'a'], ['a', 'idx'], ['a', 'db']],
    );
    expect(fires(level, g, 'search-no-index')).toBe(false);
  });
});

describe('domain checks — fan-out (Level 5)', () => {
  const level = getLevel(5) as Level;

  it('flags synchronous fan-out with no queue', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'nosql_db' },
      ],
      [['c', 'a'], ['a', 'db']],
    );
    expect(fires(level, g, 'fanout-no-queue')).toBe(true);
  });

  it('flags a queue with no workers draining it', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'q', type: 'message_queue' },
        { id: 'db', type: 'nosql_db' },
      ],
      [['c', 'a'], ['a', 'q'], ['a', 'db']],
    );
    expect(fires(level, g, 'fanout-no-queue')).toBe(false);
    expect(fires(level, g, 'fanout-no-workers')).toBe(true);
  });

  it('clears once a queue and workers are present', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'q', type: 'message_queue' },
        { id: 'w', type: 'worker' },
        { id: 'db', type: 'nosql_db' },
      ],
      [['c', 'a'], ['a', 'q'], ['q', 'w'], ['w', 'db']],
    );
    expect(fires(level, g, 'fanout-no-queue')).toBe(false);
    expect(fires(level, g, 'fanout-no-workers')).toBe(false);
  });
});

describe('domain checks — transcode (Level 7)', () => {
  const level = getLevel(7) as Level;

  it('flags transcoding on the request path with no worker', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'obj', type: 'object_storage' },
      ],
      [['c', 'a'], ['a', 'obj']],
    );
    expect(fires(level, g, 'transcode-on-request-path')).toBe(true);
  });

  it('clears once a worker handles transcoding', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'q', type: 'message_queue' },
        { id: 'w', type: 'worker' },
        { id: 'obj', type: 'object_storage' },
      ],
      [['c', 'a'], ['a', 'q'], ['q', 'w'], ['w', 'obj']],
    );
    expect(fires(level, g, 'transcode-on-request-path')).toBe(false);
  });
});

describe('domain checks stay off untagged levels', () => {
  it('Level 1 never raises domain findings', () => {
    const level = getLevel(1) as Level;
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
      ],
      [['c', 'a']],
    );
    const ids = simulate(g, level.trafficDefaults, level).findings.map((f) => f.id);
    for (const domainId of [
      'api-no-gateway',
      'search-no-index',
      'fanout-no-queue',
      'fanout-no-workers',
      'transcode-on-request-path',
    ]) {
      expect(ids).not.toContain(domainId);
    }
  });
});
