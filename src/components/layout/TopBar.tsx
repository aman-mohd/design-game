import { Flame, Star, Zap } from 'lucide-react';
import { useGame } from '../../store/gameStore';

export function TopBar() {
  const xp = useGame((s) => s.xp);
  const streak = useGame((s) => s.streak);
  const view = useGame((s) => s.view);
  const goToMap = useGame((s) => s.goToMap);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={goToMap}
        className="flex items-center gap-2 font-display text-xl font-extrabold text-duo-green"
      >
        <img src="/fox.svg" alt="" className="h-8 w-8" />
        <span className="hidden sm:inline">DesignQuest</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-4">
        <Stat icon={<Flame className="h-5 w-5 text-orange-500" />} value={streak} title="Day streak" />
        <Stat icon={<Zap className="h-5 w-5 text-yellow-500" fill="currentColor" />} value={xp} title="Total XP" />
        {view === 'game' && (
          <button onClick={goToMap} className="btn-ghost py-2 text-xs">
            <Star className="h-4 w-4" /> Levels
          </button>
        )}
      </div>
    </header>
  );
}

function Stat({ icon, value, title }: { icon: React.ReactNode; value: number; title: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-cloud px-3 py-1.5" title={title}>
      {icon}
      <span className="font-display text-base font-extrabold text-ink tabular-nums">{value}</span>
    </div>
  );
}
