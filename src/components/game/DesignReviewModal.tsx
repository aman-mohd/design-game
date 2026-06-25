import { motion } from 'framer-motion';
import { X, AlertTriangle, PackagePlus, CheckCircle2, Scale, Check } from 'lucide-react';
import type { DesignReview } from '../../engine/review';
import { consistencyLabel } from '../../engine/review';
import { Mascot } from '../ui/Mascot';

interface Props {
  review: DesignReview;
  levelTitle: string;
  onClose: () => void;
}

export function DesignReviewModal({ review, levelTitle, onClose }: Props) {
  const { suboptimal, missing, strengths, cap } = review;
  const allGood = suboptimal.length === 0 && missing.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="card flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b-2 border-line bg-gradient-to-br from-cat-compute/10 to-transparent p-5">
          <Mascot size={52} mood="think" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-extrabold text-ink">Design Review</h2>
            <p className="text-sm text-subtle">{levelTitle} — choices, trade-offs & the CAP lens</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review"
            className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-cloud"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          {/* What wasn't optimal */}
          {allGood ? (
            <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Verdict" tint="good">
              <p className="text-sm text-ink/85">
                Clean, well-scoped design — no bottlenecks left on the table and every
                recommended component is in place. Now explore how the CAP choice below would
                reshape it.
              </p>
            </Section>
          ) : (
            <>
              {suboptimal.length > 0 && (
                <Section
                  icon={<AlertTriangle className="h-4 w-4" />}
                  title="What wasn't the best choice"
                  tint="warn"
                >
                  {suboptimal.map((item, i) => (
                    <ReviewRow key={i} title={item.title} detail={item.detail} />
                  ))}
                </Section>
              )}

              {missing.length > 0 && (
                <Section
                  icon={<PackagePlus className="h-4 w-4" />}
                  title="Components you could have added"
                  tint="info"
                >
                  {missing.map((item, i) => (
                    <ReviewRow key={i} title={item.title} detail={item.detail} />
                  ))}
                </Section>
              )}
            </>
          )}

          {strengths.length > 0 && (
            <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Good calls" tint="good">
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-duo-green/10 px-2.5 py-1 text-xs font-bold text-duo-greenDark"
                    title={s.detail}
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* CAP deep dive */}
          {cap && (
            <Section
              icon={<Scale className="h-4 w-4" />}
              title="Other options: the CAP trade-off"
              tint="cap"
            >
              <p className="mb-3 text-sm leading-snug text-ink/85">{cap.summary}</p>

              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-subtle">You chose:</span>
                <span className="rounded-full border-2 border-cat-compute bg-cat-compute/10 px-2.5 py-1 font-bold text-cat-compute">
                  {consistencyLabel(cap.chosen)}
                </span>
                <span className="font-bold text-subtle">Fits this system:</span>
                <span className="rounded-full border-2 border-duo-greenDark bg-duo-green/10 px-2.5 py-1 font-bold text-duo-greenDark">
                  {consistencyLabel(cap.recommended)}
                </span>
                {cap.matched && (
                  <span className="flex items-center gap-1 font-bold text-duo-green">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> match
                  </span>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <CapCard
                  label="If you need Consistency (CP)"
                  body={cap.consistencyPath}
                  highlight={cap.recommended === 'consistency'}
                />
                <CapCard
                  label="If you need Availability (AP)"
                  body={cap.availabilityPath}
                  highlight={cap.recommended === 'availability'}
                />
              </div>
            </Section>
          )}
        </div>

        <div className="border-t-2 border-line p-4">
          <button onClick={onClose} className="btn-green w-full">
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const TINT: Record<string, string> = {
  warn: 'text-warn',
  info: 'text-cat-compute',
  good: 'text-duo-green',
  cap: 'text-cat-network',
};

function Section({
  icon,
  title,
  tint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tint: keyof typeof TINT | string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide ${TINT[tint] ?? 'text-subtle'}`}>
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-white p-3">
      <div className="font-display text-sm font-extrabold text-ink">{title}</div>
      <p className="mt-0.5 text-sm leading-snug text-ink/80">{detail}</p>
    </div>
  );
}

function CapCard({ label, body, highlight }: { label: string; body: string; highlight: boolean }) {
  return (
    <div
      className={`rounded-2xl border-2 p-3 ${
        highlight ? 'border-duo-greenDark bg-duo-green/5' : 'border-line bg-cloud/40'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 font-display text-sm font-extrabold text-ink">
        {label}
        {highlight && (
          <span className="rounded-full bg-duo-green px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
            best fit
          </span>
        )}
      </div>
      <p className="text-xs leading-snug text-ink/80">{body}</p>
    </div>
  );
}
