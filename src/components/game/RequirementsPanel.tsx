import { CheckCircle2, Circle, Target, Gauge, BookOpen } from 'lucide-react';
import type { Level } from '../../data/types';
import { useGame } from '../../store/gameStore';
import { Mascot } from '../ui/Mascot';

export function RequirementsPanel({ level }: { level: Level }) {
  const result = useGame((s) => s.result);
  const met = new Set(result?.metRequirements ?? []);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-start gap-3 border-b-2 border-line bg-gradient-to-br from-duo-greenLight/20 to-transparent p-4">
        <Mascot size={56} mood="think" />
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">{level.title}</h2>
          <p className="mt-1 text-sm leading-snug text-ink/80">{level.brief}</p>
        </div>
      </div>

      <div className="space-y-5 p-4">
        <Section icon={<Target className="h-4 w-4" />} title="What it must do">
          {level.functionalRequirements.map((r) => (
            <ReqRow key={r.id} text={r.text} met={met.has(r.id)} hasResult={!!result} />
          ))}
        </Section>

        <Section icon={<Gauge className="h-4 w-4" />} title="How well it must do it">
          {level.nonFunctionalRequirements.map((r) => (
            <ReqRow key={r.id} text={r.text} met={met.has(r.id)} hasResult={!!result} />
          ))}
        </Section>

        {level.references && level.references.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-subtle">
              <BookOpen className="h-4 w-4" />
              Learn the concepts
            </div>
            <ul className="space-y-1.5">
              {level.references.map((ref) => (
                <li key={ref.url}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-cloud px-2.5 py-1.5 text-xs font-bold text-cat-compute hover:underline"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ref.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-subtle">
        {icon}
        {title}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function ReqRow({ text, met, hasResult }: { text: string; met: boolean; hasResult: boolean }) {
  return (
    <li className="flex items-start gap-2 rounded-2xl border-2 border-line bg-white p-2.5">
      {hasResult && met ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-duo-green" />
      ) : (
        <Circle className={`mt-0.5 h-5 w-5 shrink-0 ${hasResult ? 'text-line' : 'text-subtle'}`} />
      )}
      <span className={`text-sm ${hasResult && met ? 'text-ink' : 'text-ink/80'}`}>{text}</span>
    </li>
  );
}
