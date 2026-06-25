import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, RotateCcw, ArrowRight, Telescope, Lightbulb } from 'lucide-react';
import type { ScoreBreakdown } from '../../data/types';
import { Mascot } from '../ui/Mascot';

interface Props {
  score: ScoreBreakdown;
  levelTitle: string;
  hasNextLevel: boolean;
  hasBestSolution: boolean;
  onReview: () => void;
  onShowBest: () => void;
  onRetry: () => void;
  onNext: () => void;
  onMap: () => void;
}

export function ScoreCard({
  score,
  levelTitle,
  hasNextLevel,
  hasBestSolution,
  onReview,
  onShowBest,
  onRetry,
  onNext,
  onMap,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <Confetti count={score.stars >= 2 ? 60 : 0} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="card w-full max-w-md overflow-hidden"
      >
        <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-duo-greenLight/30 to-transparent p-6 text-center">
          <Mascot size={72} mood={score.stars >= 2 ? 'cheer' : 'happy'} />
          <h2 className="font-display text-2xl font-extrabold text-ink">
            {score.stars >= 3 ? 'Masterful!' : score.stars >= 2 ? 'Nicely done!' : score.stars >= 1 ? 'Good start!' : 'Lesson learned!'}
          </h2>
          <p className="text-sm text-subtle">{levelTitle}</p>
          <StarRow count={score.stars} />
          <div className="mt-1 flex items-center gap-1 font-display text-3xl font-extrabold text-ink">
            <CountUp to={score.total} />
            <span className="text-lg text-subtle">/100</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-extrabold text-yellow-700">
            <Zap className="h-4 w-4" fill="currentColor" /> +{score.xp} XP
          </div>
        </div>

        <div className="space-y-2 px-6 pb-2">
          <Bar label="Correctness" value={score.correctness} color="#58CC02" />
          <Bar label="Requirements" value={score.requirements} color="#1CB0F6" />
          <Bar label="Efficiency (cost)" value={score.efficiency} color="#CE82FF" />
        </div>

        <div className="px-6 py-4">
          <h3 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wide text-subtle">
            What you could explore next
          </h3>
          <ul className="space-y-1.5">
            {score.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/85">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-duo-green" />
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-2">
            <button
              onClick={onReview}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-cat-network bg-cat-network/10 px-4 py-2.5 font-display text-sm font-extrabold text-cat-network transition-all hover:bg-cat-network/20 active:translate-y-0.5"
            >
              <Telescope className="h-4 w-4" /> Review choices & CAP options
            </button>
            {hasBestSolution && (
              <button
                onClick={onShowBest}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-duo-greenDark bg-duo-green/10 px-4 py-2.5 font-display text-sm font-extrabold text-duo-greenDark transition-all hover:bg-duo-green/20 active:translate-y-0.5"
              >
                <Lightbulb className="h-4 w-4" /> Show best solution
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t-2 border-line p-4">
          <button onClick={onRetry} className="btn-ghost flex-1 text-sm">
            <RotateCcw className="h-4 w-4" /> Refine
          </button>
          {hasNextLevel ? (
            <button onClick={onNext} className="btn-green flex-1 text-sm">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={onMap} className="btn-green flex-1 text-sm">
              Level map <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15 * n, type: 'spring', stiffness: 300 }}
        >
          <Star
            className={`h-9 w-9 ${n <= count ? 'text-warn' : 'text-line'}`}
            fill={n <= count ? '#FFC800' : 'none'}
            strokeWidth={1.5}
          />
        </motion.div>
      ))}
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs font-bold text-subtle">
        <span>{label}</span>
        <span className="tabular-nums text-ink">{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className="tabular-nums">{n}</span>;
}

function Confetti({ count }: { count: number }) {
  const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FFC800', '#FF4B4B'];
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <motion.div
            key={i}
            className="absolute top-0 rounded-sm"
            style={{ left: `${left}%`, width: size, height: size, backgroundColor: color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', opacity: [1, 1, 0], rotate: 360 }}
            transition={{ duration: 1.8 + Math.random(), delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}
