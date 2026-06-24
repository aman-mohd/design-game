// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import App from './App';
import { useGame } from './store/gameStore';

// Minimal browser API shims so React Flow / framer-motion can mount in jsdom.
beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
  // @ts-expect-error test shim
  globalThis.DOMMatrixReadOnly = class {
    m22 = 1;
    constructor() {}
  };
  // Override unconditionally — jsdom's matchMedia lacks the legacy
  // addListener/removeListener that framer-motion still calls.
  // @ts-expect-error test shim
  window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
  Element.prototype.getBoundingClientRect = function () {
    return { width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON() {} } as DOMRect;
  };
});

afterEach(() => {
  cleanup();
  // Reset to the level map between tests.
  useGame.setState({ view: 'map', currentLevelId: null });
});

describe('App smoke', () => {
  it('boots to the level map', () => {
    render(<App />);
    expect(screen.getByText('Learn System Design')).toBeTruthy();
    expect(screen.getByText('Your First Web App')).toBeTruthy();
  });

  it('enters a level and shows the three-panel game UI', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Your First Web App'));
    // Requirements panel (left)
    expect(screen.getByText('What it must do')).toBeTruthy();
    // Toolbox (right, default tab)
    expect(screen.getByText('🧰 Toolbox')).toBeTruthy();
  });

  it('runs the full traffic → report → submit loop without crashing', () => {
    useGame.getState().startLevel(1);
    render(<App />);
    // Switch to the Traffic tab and send traffic.
    fireEvent.click(screen.getByText('Traffic'));
    fireEvent.click(screen.getByText('Send Traffic'));
    // Report tab now shows a traffic report.
    expect(screen.getByText('📊 Traffic Report')).toBeTruthy();
    // A bare client→app design must surface the "no data store" bottleneck.
    expect(screen.getByText('Nowhere to store data')).toBeTruthy();
    // Submit produces a score card.
    fireEvent.click(screen.getByText('Submit Design & Get Score'));
    expect(screen.getByText(/XP$/)).toBeTruthy();
  });
});
