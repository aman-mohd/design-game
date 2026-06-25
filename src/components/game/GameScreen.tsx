import { useEffect, useState } from 'react';
import { Wrench, Activity, ClipboardList } from 'lucide-react';
import { useGame } from '../../store/gameStore';
import { getLevel, LEVELS } from '../../data/levels';
import { RequirementsPanel } from './RequirementsPanel';
import { DesignCanvas } from './DesignCanvas';
import { ToolsDrawer } from './ToolsDrawer';
import { TrafficPanel } from './TrafficPanel';
import { ResultsPanel } from './ResultsPanel';
import { ScoreCard } from './ScoreCard';
import { DesignReviewModal } from './DesignReviewModal';
import { BestSolutionModal } from './BestSolutionModal';
import { buildDesignReview } from '../../engine/review';

type Tab = 'build' | 'traffic' | 'report';

export function GameScreen() {
  const levelId = useGame((s) => s.currentLevelId)!;
  const level = getLevel(levelId)!;
  const runSimulation = useGame((s) => s.runSimulation);
  const submitDesign = useGame((s) => s.submitDesign);
  const startLevel = useGame((s) => s.startLevel);
  const goToMap = useGame((s) => s.goToMap);
  const score = useGame((s) => s.score);
  const graph = useGame((s) => s.graph);
  const traffic = useGame((s) => s.traffic);
  const result = useGame((s) => s.result);
  const findingsCount = useGame((s) => s.result?.findings.length ?? 0);
  const hasRunOnce = useGame((s) => s.hasRunOnce);

  const [tab, setTab] = useState<Tab>('build');
  const [showScore, setShowScore] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showBest, setShowBest] = useState(false);

  // Reset local UI when switching levels.
  useEffect(() => {
    setTab('build');
    setShowScore(false);
    setShowReview(false);
    setShowBest(false);
  }, [levelId]);

  const handleSend = () => {
    runSimulation();
    setTab('report');
  };

  const handleSubmit = () => {
    submitDesign();
    setShowScore(true);
  };

  const hasNext = LEVELS.some((l) => l.id === level.id + 1);

  return (
    <div className="flex h-[calc(100vh-61px)] overflow-hidden">
      {/* LEFT: requirements */}
      <aside className="hidden w-72 shrink-0 border-r-2 border-line bg-white md:block">
        <RequirementsPanel level={level} />
      </aside>

      {/* CENTER: canvas */}
      <main className="relative flex-1">
        <DesignCanvas />
        <div className="pointer-events-none absolute left-3 top-3 rounded-2xl bg-white/90 px-3 py-1.5 text-xs font-bold text-subtle shadow-card backdrop-blur">
          Drag from the toolbox · connect the dots · drag handles to link
        </div>
      </main>

      {/* RIGHT: tabbed control deck */}
      <aside className="flex w-[340px] shrink-0 flex-col border-l-2 border-line bg-white">
        <div className="flex border-b-2 border-line">
          <TabButton active={tab === 'build'} onClick={() => setTab('build')} icon={<Wrench className="h-4 w-4" />} label="Build" />
          <TabButton active={tab === 'traffic'} onClick={() => setTab('traffic')} icon={<Activity className="h-4 w-4" />} label="Traffic" />
          <TabButton
            active={tab === 'report'}
            onClick={() => setTab('report')}
            icon={<ClipboardList className="h-4 w-4" />}
            label="Report"
            badge={hasRunOnce ? findingsCount : undefined}
          />
        </div>

        <div className="min-h-0 flex-1">
          {tab === 'build' && <ToolsDrawer level={level} />}
          {tab === 'traffic' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3">
                <h3 className="font-display text-lg font-extrabold text-ink">⚡ Send Traffic</h3>
                <p className="text-xs text-subtle">
                  Tune the real-world conditions, then unleash it on your design.
                </p>
              </div>
              <TrafficPanel level={level} onSend={handleSend} />
            </div>
          )}
          {tab === 'report' && <ResultsPanel onSubmit={handleSubmit} />}
        </div>
      </aside>

      {showScore && score && (
        <ScoreCard
          score={score}
          levelTitle={level.title}
          hasNextLevel={hasNext}
          hasBestSolution={Boolean(level.bestSolution)}
          onReview={() => setShowReview(true)}
          onShowBest={() => setShowBest(true)}
          onRetry={() => setShowScore(false)}
          onNext={() => startLevel(level.id + 1)}
          onMap={goToMap}
        />
      )}

      {showReview && result && (
        <DesignReviewModal
          review={buildDesignReview(graph, traffic, level, result)}
          levelTitle={level.title}
          onClose={() => setShowReview(false)}
        />
      )}

      {showBest && level.bestSolution && (
        <BestSolutionModal
          solution={level.bestSolution}
          levelTitle={level.title}
          onClose={() => setShowBest(false)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-extrabold uppercase tracking-wide transition-all ${
        active ? 'border-b-2 border-duo-green text-duo-green' : 'text-subtle hover:bg-cloud'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
