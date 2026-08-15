import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedLogo, { LOGO_ANIM_DURATION } from './AnimatedLogo';
import { DARK_GOLD, TEXT_BLACK } from './LogoMark';

interface LoadingScreenProps {
  onDone?: () => void;
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'play' | 'fade'>('play');

  useEffect(() => {
    const t = setTimeout(() => setPhase('fade'), (LOGO_ANIM_DURATION + 1.1) * 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'fade') return;
    const t = setTimeout(() => onDone?.(), 600);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-white"
      style={{ opacity: 1 }}
      animate={{ opacity: phase === 'fade' ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* soft gold ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.14), transparent 60%)' }}
        />
        <div
          className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(193,18,31,0.06), transparent 60%)' }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-12 px-6">
        <AnimatedLogo size={220} />

        {/* wordmark fades in once the network is formed */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.7, ease: 'easeOut' }}
        >
          <div
            className="text-3xl sm:text-4xl font-black tracking-[0.35em]"
            style={{ color: TEXT_BLACK }}
          >
            SYNCSPACE
          </div>
          <div
            className="mt-3 text-xs sm:text-sm tracking-[0.3em] uppercase"
            style={{ color: DARK_GOLD }}
          >
            One Workspace&nbsp;•&nbsp;Infinite&nbsp;Collaboration
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
