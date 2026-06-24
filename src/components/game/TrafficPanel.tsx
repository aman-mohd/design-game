import { Activity, Globe2, Scale, Zap, BadgeAlert, FileStack, Timer } from 'lucide-react';
import { useGame } from '../../store/gameStore';
import { ALL_REGIONS, type Consistency } from '../../data/types';

function formatRps(rps: number): string {
  if (rps >= 1_000_000) return `${(rps / 1_000_000).toFixed(1)}M`;
  if (rps >= 1000) return `${Math.round(rps / 1000)}K`;
  return `${rps}`;
}

// Log-ish RPS scale via a 0..100 slider for nicer feel across magnitudes.
const RPS_MIN = 100;
const RPS_MAX = 1_000_000;
function sliderToRps(v: number): number {
  const t = v / 100;
  const val = RPS_MIN * Math.pow(RPS_MAX / RPS_MIN, t);
  return Math.round(val / 100) * 100;
}
function rpsToSlider(rps: number): number {
  return Math.round((Math.log(rps / RPS_MIN) / Math.log(RPS_MAX / RPS_MIN)) * 100);
}

export function TrafficPanel({ onSend }: { onSend: () => void }) {
  const traffic = useGame((s) => s.traffic);
  const setTraffic = useGame((s) => s.setTraffic);

  const toggleRegion = (r: string) => {
    const has = traffic.regions.includes(r);
    const next = has ? traffic.regions.filter((x) => x !== r) : [...traffic.regions, r];
    if (next.length === 0) return; // keep at least one
    setTraffic({ regions: next });
  };

  return (
    <div className="space-y-4">
      <Row icon={<Activity className="h-4 w-4" />} label="Traffic volume" value={`${formatRps(traffic.rps)} req/s`}>
        <input
          type="range"
          min={0}
          max={100}
          value={rpsToSlider(traffic.rps)}
          onChange={(e) => setTraffic({ rps: sliderToRps(Number(e.target.value)) })}
          className="duo-range"
        />
      </Row>

      <Row icon={<Scale className="h-4 w-4" />} label="Read / Write mix" value={`${traffic.readPercent}% reads`}>
        <input
          type="range"
          min={0}
          max={100}
          value={traffic.readPercent}
          onChange={(e) => setTraffic({ readPercent: Number(e.target.value) })}
          className="duo-range"
        />
      </Row>

      <Row icon={<FileStack className="h-4 w-4" />} label="Payload size" value={`${traffic.payloadKb} KB`}>
        <input
          type="range"
          min={1}
          max={2000}
          step={10}
          value={traffic.payloadKb}
          onChange={(e) => setTraffic({ payloadKb: Number(e.target.value) })}
          className="duo-range"
        />
      </Row>

      <Row icon={<Timer className="h-4 w-4" />} label="Latency target (p99)" value={`${traffic.latencySlaMs} ms`}>
        <input
          type="range"
          min={50}
          max={1000}
          step={10}
          value={traffic.latencySlaMs}
          onChange={(e) => setTraffic({ latencySlaMs: Number(e.target.value) })}
          className="duo-range"
        />
      </Row>

      <div>
        <Label icon={<Globe2 className="h-4 w-4" />} label="Traffic origins" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ALL_REGIONS.map((r) => {
            const on = traffic.regions.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${
                  on
                    ? 'border-duo-greenDark bg-duo-green text-white'
                    : 'border-line bg-white text-subtle hover:bg-cloud'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label icon={<Scale className="h-4 w-4" />} label="CAP lean" />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {(
            [
              ['availability', 'Availability'],
              ['balanced', 'Balanced'],
              ['consistency', 'Consistency'],
            ] as [Consistency, string][]
          ).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setTraffic({ consistency: val })}
              className={`rounded-2xl border-2 px-2 py-2 text-xs font-bold transition-all ${
                traffic.consistency === val
                  ? 'border-cat-compute bg-cat-compute/10 text-cat-compute'
                  : 'border-line bg-white text-subtle hover:bg-cloud'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ToggleChip
          icon={<Zap className="h-4 w-4" />}
          label="Traffic spike"
          on={traffic.spike}
          onClick={() => setTraffic({ spike: !traffic.spike })}
        />
        <ToggleChip
          icon={<BadgeAlert className="h-4 w-4" />}
          label="Chaos (kill a node)"
          on={traffic.failureInjection}
          danger
          onClick={() => setTraffic({ failureInjection: !traffic.failureInjection })}
        />
      </div>

      <button onClick={onSend} className="btn-green w-full text-base">
        <Zap className="h-5 w-5" fill="currentColor" /> Send Traffic
      </button>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label icon={icon} label={label} />
        <span className="font-display text-sm font-extrabold text-ink tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Label({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-subtle">
      {icon}
      {label}
    </span>
  );
}

function ToggleChip({
  icon,
  label,
  on,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const active = danger
    ? 'border-danger bg-danger/10 text-danger'
    : 'border-duo-greenDark bg-duo-green/10 text-duo-greenDark';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-2xl border-2 px-2 py-2 text-xs font-bold transition-all ${
        on ? active : 'border-line bg-white text-subtle hover:bg-cloud'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
