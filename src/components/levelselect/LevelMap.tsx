import { motion } from 'framer-motion';
import { Lock, Star, Check } from 'lucide-react';
import { LEVELS } from '../../data/levels';
import { useGame, isLevelUnlocked } from '../../store/gameStore';
import { Mascot } from '../ui/Mascot';

export function LevelMap() {
  const progress = useGame((s) => s.progress);
  const startLevel = useGame((s) => s.startLevel);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
        <Mascot size={64} mood="happy" />
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Learn System Design</h1>
          <p className="text-subtle">
            Design real systems, send traffic, and discover the bottlenecks. There’s no losing —
            only learning.
          </p>
        </div>
      </div>

      <ol className="relative flex flex-col items-center gap-6">
        {LEVELS.map((level, i) => {
          const unlocked = isLevelUnlocked(level.id, progress);
          const p = progress[level.id];
          const offset = [0, 90, -90, 60, -60][i % 5];
          return (
            <li key={level.id} className="flex w-full justify-center" style={{ transform: `translateX(${offset}px)` }}>
              <motion.button
                whileHover={unlocked ? { scale: 1.05 } : undefined}
                whileTap={unlocked ? { scale: 0.96 } : undefined}
                disabled={!unlocked}
                onClick={() => unlocked && startLevel(level.id)}
                className="group flex w-72 items-center gap-4 rounded-3xl border-2 border-line bg-white p-4 text-left shadow-card disabled:opacity-60"
              >
                <Bubble unlocked={unlocked} completed={p?.completed} index={level.id} />
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-extrabold text-ink">
                    {level.title}
                  </div>
                  <div className="truncate text-sm text-subtle">{level.subtitle}</div>
                  {p?.completed ? (
                    <Stars count={p.bestStars} />
                  ) : unlocked ? (
                    <span className="text-xs font-bold uppercase tracking-wide text-duo-green">
                      Start →
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wide text-subtle">
                      Locked
                    </span>
                  )}
                </div>
              </motion.button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Bubble({ unlocked, completed, index }: { unlocked: boolean; completed?: boolean; index: number }) {
  const base =
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-extrabold text-white';
  if (!unlocked)
    return (
      <div className={`${base} bg-line text-subtle`} style={{ boxShadow: '0 4px 0 #cfcfcf' }}>
        <Lock className="h-6 w-6" />
      </div>
    );
  if (completed)
    return (
      <div className={`${base} bg-duo-green`} style={{ boxShadow: '0 4px 0 #46A302' }}>
        <Check className="h-7 w-7" strokeWidth={3} />
      </div>
    );
  return (
    <div className={`${base} bg-cat-compute`} style={{ boxShadow: '0 4px 0 #1186c4' }}>
      {index}
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= count ? 'text-warn' : 'text-line'}`}
          fill={n <= count ? '#FFC800' : 'none'}
        />
      ))}
    </div>
  );
}
