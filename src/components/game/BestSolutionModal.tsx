import { motion } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import type { SolutionGraph } from '../../data/types';
import { StaticDiagram } from './StaticDiagram';

interface Props {
  solution: SolutionGraph;
  levelTitle: string;
  onClose: () => void;
}

export function BestSolutionModal({ solution, levelTitle, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b-2 border-line bg-gradient-to-br from-duo-greenLight/25 to-transparent p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-duo-green text-white">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-extrabold text-ink">A strong solution</h2>
            <p className="text-sm text-subtle">{levelTitle} — one reference architecture</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close best solution"
            className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-cloud"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Diagram */}
        <div className="h-[48vh] w-full border-b-2 border-line">
          <StaticDiagram graph={solution} />
        </div>

        {/* Rationale */}
        {solution.rationale && (
          <div className="flex items-start gap-2 px-5 py-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-sm leading-snug text-ink/85">{solution.rationale}</p>
          </div>
        )}

        <div className="border-t-2 border-line p-4">
          <p className="mb-2 text-center text-xs text-subtle">
            This is one good answer — not the only one. Compare it with your design.
          </p>
          <button onClick={onClose} className="btn-green w-full">
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
