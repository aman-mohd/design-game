import { useMemo, useState } from 'react';
import { TOOLS } from '../../data/tools';
import type { Level, ToolCategory } from '../../data/types';
import { Icon } from '../ui/Icon';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../../theme/tokens';

const ORDER: ToolCategory[] = ['compute', 'network', 'data', 'messaging'];

export function ToolsDrawer({ level }: { level: Level }) {
  const available = useMemo(
    () => TOOLS.filter((t) => level.availableToolIds.includes(t.id) && t.category !== 'client'),
    [level],
  );

  const grouped = useMemo(() => {
    const g: Record<string, typeof available> = {};
    for (const t of available) (g[t.category] ??= []).push(t);
    return g;
  }, [available]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-line px-4 py-3">
        <h3 className="font-display text-lg font-extrabold text-ink">🧰 Toolbox</h3>
        <p className="text-xs text-subtle">Drag a component onto the canvas.</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {ORDER.filter((c) => grouped[c]?.length).map((cat) => (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLOR[cat] }}
              />
              <span className="text-xs font-extrabold uppercase tracking-wide text-subtle">
                {CATEGORY_LABEL[cat]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {grouped[cat].map((t) => (
                <ToolChip key={t.id} toolId={t.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolChip({ toolId }: { toolId: string }) {
  const tool = TOOLS.find((t) => t.id === toolId)!;
  const [showTip, setShowTip] = useState(false);
  const color = CATEGORY_COLOR[tool.category];

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/designquest-tool', tool.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        className="flex cursor-grab items-center gap-2 rounded-2xl border-2 border-line bg-white p-2 transition-all hover:-translate-y-0.5 hover:shadow-card active:cursor-grabbing"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          <Icon name={tool.icon} className="h-5 w-5" />
        </div>
        <span className="truncate text-sm font-bold text-ink">{tool.name}</span>
      </div>
      {showTip && (
        <div className="pointer-events-none absolute -top-1 left-1/2 z-30 w-44 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {tool.blurb}
        </div>
      )}
    </div>
  );
}
