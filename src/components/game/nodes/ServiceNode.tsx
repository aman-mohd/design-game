import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lock } from 'lucide-react';
import { Icon } from '../../ui/Icon';
import { getTool } from '../../../data/tools';
import { CATEGORY_COLOR } from '../../../theme/tokens';
import type { Severity } from '../../../data/types';

export interface ServiceNodeData {
  type: string;
  label: string;
  locked?: boolean;
  bottleneck?: Severity | null;
  [key: string]: unknown;
}

export function ServiceNode({ data, selected }: NodeProps & { data: ServiceNodeData }) {
  const tool = getTool(data.type);
  const color = tool ? CATEGORY_COLOR[tool.category] : '#999';
  const bottleneck = data.bottleneck;

  const ring =
    bottleneck === 'critical'
      ? 'ring-4 ring-danger animate-pulseRing'
      : bottleneck === 'warn'
        ? 'ring-4 ring-warn'
        : selected
          ? 'ring-4 ring-cat-compute'
          : 'ring-0';

  return (
    <div
      className={`relative flex w-[120px] flex-col items-center gap-1 rounded-2xl border-2 border-line bg-white px-2 py-3 shadow-card transition-all ${ring}`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-subtle" />
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: color }}
      >
        <Icon name={tool?.icon ?? 'Server'} className="h-6 w-6" />
      </div>
      <div className="text-center font-display text-sm font-bold leading-tight text-ink">
        {data.label}
      </div>
      {data.locked && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cloud text-subtle shadow">
          <Lock className="h-3.5 w-3.5" />
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-subtle" />
    </div>
  );
}
