import { describe, it, expect, beforeEach } from 'vitest';
import { useGame } from './gameStore';

function reset() {
  useGame.getState().startLevel(1);
}

describe('gameStore node lifecycle', () => {
  beforeEach(reset);

  it('adds a component from the toolbox', () => {
    const before = useGame.getState().graph.nodes.length;
    useGame.getState().addNode('cache', 200, 200);
    expect(useGame.getState().graph.nodes.length).toBe(before + 1);
  });

  it('deletes a user-added component', () => {
    useGame.getState().addNode('cache', 200, 200);
    const added = useGame.getState().graph.nodes.find((n) => n.type === 'cache')!;
    expect(added).toBeTruthy();

    useGame.getState().removeNode(added.id);
    expect(useGame.getState().graph.nodes.some((n) => n.id === added.id)).toBe(false);
  });

  it('removes edges attached to a deleted component', () => {
    useGame.getState().addNode('cache', 200, 200);
    const cache = useGame.getState().graph.nodes.find((n) => n.type === 'cache')!;
    const app = useGame.getState().graph.nodes.find((n) => n.type === 'app_server')!;
    useGame.getState().connect(app.id, cache.id);
    expect(useGame.getState().graph.edges.some((e) => e.target === cache.id)).toBe(true);

    useGame.getState().removeNode(cache.id);
    expect(
      useGame.getState().graph.edges.some((e) => e.source === cache.id || e.target === cache.id),
    ).toBe(false);
  });

  it('does not delete pre-placed locked components', () => {
    const locked = useGame.getState().graph.nodes.find((n) => n.locked)!;
    expect(locked).toBeTruthy();
    useGame.getState().removeNode(locked.id);
    expect(useGame.getState().graph.nodes.some((n) => n.id === locked.id)).toBe(true);
  });
});
