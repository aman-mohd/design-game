import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertOctagon, Info, Lightbulb, PartyPopper } from 'lucide-react';
import { useGame } from '../../store/gameStore';
import type { Finding, Severity } from '../../data/types';
import { SEVERITY_COLOR } from '../../theme/tokens';

const SEV_ICON: Record<Severity, React.ReactNode> = {
  critical: <AlertOctagon className="h-5 w-5" />,
  warn: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

export function ResultsPanel({ onSubmit }: { onSubmit: () => void }) {
  const result = useGame((s) => s.result);
  const hasRunOnce = useGame((s) => s.hasRunOnce);

  if (!hasRunOnce || !result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Lightbulb className="h-10 w-10 text-warn" />
        <p className="font-display text-lg font-extrabold text-ink">Ready when you are</p>
        <p className="text-sm text-subtle">
          Build your design, tune the traffic, then hit <b>Send Traffic</b> to reveal the
          bottlenecks. Fix them and run again — that’s where the learning happens.
        </p>
      </div>
    );
  }

  const findings = result.findings;
  const criticals = findings.filter((f) => f.severity === 'critical').length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-line p-4">
        <h3 className="font-display text-lg font-extrabold text-ink">📊 Traffic Report</h3>
        <p className="text-xs text-subtle">
          {findings.length === 0
            ? 'No bottlenecks detected at this traffic profile.'
            : `${findings.length} issue${findings.length > 1 ? 's' : ''} found${
                criticals ? ` · ${criticals} critical` : ''
              }. Tap one for a hint.`}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {findings.length === 0 ? (
          <AllClear />
        ) : (
          <AnimatePresence initial={false}>
            {findings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="border-t-2 border-line p-4">
        <button onClick={onSubmit} className="btn-blue w-full">
          Submit Design & Get Score
        </button>
      </div>
    </div>
  );
}

function AllClear() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2 rounded-3xl border-2 border-duo-green bg-duo-green/10 p-6 text-center"
    >
      <PartyPopper className="h-9 w-9 text-duo-green" />
      <p className="font-display text-lg font-extrabold text-ink">No bottlenecks!</p>
      <p className="text-sm text-subtle">
        Your design handles this traffic. Try cranking up the volume, enabling chaos, or going
        global to stress it further.
      </p>
    </motion.div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [tier, setTier] = useState(0); // how many hints revealed
  const color = SEVERITY_COLOR[finding.severity];

  // Reset revealed hints when this finding changes identity.
  useEffect(() => setTier(0), [finding.id]);

  const revealed = finding.hints.slice(0, tier);
  const moreHints = tier < finding.hints.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-2xl border-2 bg-white"
      style={{ borderColor: color }}
    >
      <div className="flex items-start gap-2 p-3">
        <span className="mt-0.5 shrink-0" style={{ color }}>
          {SEV_ICON[finding.severity]}
        </span>
        <div className="min-w-0">
          <div className="font-display text-sm font-extrabold text-ink">{finding.title}</div>
          <p className="mt-0.5 text-sm leading-snug text-ink/80">{finding.why}</p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {revealed.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mx-3 mb-2 flex items-start gap-2 rounded-xl bg-warn/15 px-3 py-2"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <span className="text-sm text-ink">{h}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="px-3 pb-3">
        {moreHints ? (
          <button
            onClick={() => setTier((t) => t + 1)}
            className="text-xs font-extrabold uppercase tracking-wide text-cat-compute hover:underline"
          >
            {tier === 0 ? '💡 Nudge me' : 'Need a stronger hint →'}
          </button>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wide text-subtle">
            That’s all the nudges — your call now
          </span>
        )}
      </div>
    </motion.div>
  );
}
