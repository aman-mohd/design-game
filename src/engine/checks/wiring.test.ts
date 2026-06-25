import { describe, it, expect } from 'vitest';
import { wiringChecks } from './wiring';
import { getLevel } from '../../data/levels';
import type { DesignGraph, Level, TrafficConfig } from '../../data/types';

const L1 = getLevel(1) as Level;
const traffic: TrafficConfig = { ...L1.trafficDefaults };

function graph(
  nodes: Array<{ id: string; type: string }>,
  edges: Array<[string, string]>,
): DesignGraph {
  return {
    nodes: nodes.map((n, i) => ({ id: n.id, type: n.type, label: n.type, x: i * 100, y: 0 })),
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, source, target })),
  };
}

const flagged = (g: DesignGraph) =>
  wiringChecks(g, traffic, L1).some((f) => f.id === 'wiring-cache-behind-store');

describe('wiring checks — cache placement', () => {
  it('accepts cache-aside (app → cache AND app → db)', () => {
    const g = graph(
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
    expect(flagged(g)).toBe(false);
  });

  it('accepts read-through (app → cache → db, in series)', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'cache', type: 'cache' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'a'],
        ['a', 'cache'],
        ['cache', 'db'],
      ],
    );
    expect(flagged(g)).toBe(false);
  });

  it('flags a cache wired behind the database (app → db → cache)', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'db', type: 'sql_db' },
        { id: 'cache', type: 'cache' },
      ],
      [
        ['c', 'a'],
        ['a', 'db'],
        ['db', 'cache'],
      ],
    );
    expect(flagged(g)).toBe(true);
  });

  it('does not flag when there is no data store at all', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'a', type: 'app_server' },
        { id: 'cache', type: 'cache' },
      ],
      [
        ['c', 'a'],
        ['a', 'cache'],
      ],
    );
    expect(flagged(g)).toBe(false);
  });
});

const flaggedCdn = (g: DesignGraph) =>
  wiringChecks(g, traffic, L1).some((f) => f.id === 'wiring-cdn-not-fronting-media');

describe('wiring checks — CDN fronting media', () => {
  it('flags a CDN and object storage that are not connected', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'cdn', type: 'cdn' },
        { id: 'a', type: 'app_server' },
        { id: 'cache', type: 'cache' },
        { id: 'obj', type: 'object_storage' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'cdn'],
        ['cdn', 'a'],
        ['a', 'cache'],
        ['cache', 'obj'],
        ['a', 'db'],
      ],
    );
    expect(flaggedCdn(g)).toBe(true);
  });

  it('does not flag when the CDN fronts the object storage', () => {
    const g = graph(
      [
        { id: 'c', type: 'client' },
        { id: 'cdn', type: 'cdn' },
        { id: 'a', type: 'app_server' },
        { id: 'obj', type: 'object_storage' },
        { id: 'db', type: 'sql_db' },
      ],
      [
        ['c', 'cdn'],
        ['cdn', 'obj'],
        ['c', 'a'],
        ['a', 'db'],
      ],
    );
    expect(flaggedCdn(g)).toBe(false);
  });
});
