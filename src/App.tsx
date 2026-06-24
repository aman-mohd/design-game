import { useGame } from './store/gameStore';
import { TopBar } from './components/layout/TopBar';
import { LevelMap } from './components/levelselect/LevelMap';
import { GameScreen } from './components/game/GameScreen';

export default function App() {
  const view = useGame((s) => s.view);
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      {view === 'map' ? <LevelMap /> : <GameScreen />}
    </div>
  );
}
