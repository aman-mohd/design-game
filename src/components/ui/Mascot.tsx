import { motion } from 'framer-motion';

/** Pip, the DesignQuest fox. A friendly guide that floats and blinks. */
export function Mascot({ size = 72, mood = 'happy' }: { size?: number; mood?: 'happy' | 'think' | 'cheer' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={{ y: 0 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      aria-hidden
    >
      {/* ears */}
      <polygon points="20,6 44,30 14,32" fill="#F0822E" />
      <polygon points="80,6 56,30 86,32" fill="#F0822E" />
      <polygon points="25,14 38,28 21,29" fill="#C85A22" />
      <polygon points="75,14 62,28 79,29" fill="#C85A22" />

      {/* orange face */}
      <ellipse cx="50" cy="46" rx="34" ry="28" fill="#F0822E" />

      {/* white snout + cheeks */}
      <path d="M22 48 Q26 72 50 82 Q74 72 78 48 Q50 63 22 48 Z" fill="#FBF4EA" />

      {/* whiskers */}
      <g stroke="#D9B79C" strokeWidth="1.3" strokeLinecap="round" opacity="0.7">
        <line x1="41" y1="66" x2="22" y2="62" />
        <line x1="41" y1="69" x2="22" y2="71" />
        <line x1="59" y1="66" x2="78" y2="62" />
        <line x1="59" y1="69" x2="78" y2="71" />
      </g>

      {/* eyes */}
      {mood === 'cheer' ? (
        <>
          <path d="M30 45 q6 -7 12 0" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M58 45 q6 -7 12 0" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="36" cy="44" r="5.5" fill="#3C3C3C" />
          <circle cx="64" cy="44" r="5.5" fill="#3C3C3C" />
          <circle cx="38" cy="42" r="1.8" fill="#fff" />
          <circle cx="66" cy="42" r="1.8" fill="#fff" />
        </>
      )}

      {/* nose + mouth */}
      <ellipse cx="50" cy="66" rx="5" ry="4" fill="#3C3C3C" />
      <path
        d="M50 70 L50 74 M50 74 q-6 4 -10 1 M50 74 q6 4 10 1"
        stroke="#6B4A33"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
