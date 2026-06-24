import { motion } from 'framer-motion';

/** Bit, the DesignQuest owl. A friendly guide that floats and blinks. */
export function Mascot({ size = 72, mood = 'happy' }: { size?: number; mood?: 'happy' | 'think' | 'cheer' }) {
  const eyeY = mood === 'cheer' ? 42 : 45;
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
      <polygon points="26,24 36,10 44,28" fill="#46A302" />
      <polygon points="74,24 64,10 56,28" fill="#46A302" />
      <circle cx="50" cy="52" r="40" fill="#58CC02" />
      <circle cx="50" cy="58" r="30" fill="#89E219" />
      {/* eyes */}
      <circle cx="38" cy="44" r="13" fill="#fff" />
      <circle cx="62" cy="44" r="13" fill="#fff" />
      {mood === 'cheer' ? (
        <>
          <path d="M31 44 q7 -8 14 0" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M55 44 q7 -8 14 0" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="38" cy={eyeY} r="6" fill="#3C3C3C" />
          <circle cx="62" cy={eyeY} r="6" fill="#3C3C3C" />
          <circle cx="40" cy={eyeY - 2} r="2" fill="#fff" />
          <circle cx="64" cy={eyeY - 2} r="2" fill="#fff" />
        </>
      )}
      {/* beak */}
      <polygon points="50,52 43,61 57,61" fill="#FF9600" />
    </motion.svg>
  );
}
