import { useEffect, useRef, useState } from 'react';
import { AmbientField } from './canvas';
import NotebookScene from './NotebookScene';
import MindLinkScene from './MindLinkScene';
import DeskScene from './DeskScene';
import BrainScene from './BrainScene';
import { audio } from './audio';
import { TIMELINE } from './timeline';
import { clamp01 } from './geometry';

export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState(audio.muted);
  const tRef = useRef(0);
  const firedRef = useRef<Set<string>>(new Set());
  const doneRef = useRef(false);

  const scheduleAudio = (time: number) => {
    const fire = (key: string, fn: () => void) => {
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      fn();
    };
    if (time > 0.1) fire('drone', () => audio.startDrone());
    const beats = [2.3, 2.6, 2.9, 3.2, 3.5, 3.8, 4.1, 4.4];
    beats.forEach((b, i) => {
      if (time > b) fire('beat' + i, () => audio.heartbeat());
    });
    if (time > TIMELINE.deskStart) fire('whoosh-desk', () => audio.whoosh());
    if (time > 9.6) fire('chime', () => audio.chime());
    if (time > 10.2) fire('whoosh-out', () => audio.whoosh());
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tRef.current = Math.min(tRef.current + dt, TIMELINE.total);
      scheduleAudio(tRef.current);
      setT(tRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      void audio.start();
    };
    const onPointer = () => {
      void audio.start();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    void audio.start();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (t >= TIMELINE.fadeStart + TIMELINE.fadeDur && !doneRef.current) {
      doneRef.current = true;
      audio.stopDrone();
      onDone();
    }
  }, [t, onDone]);

  const skip = () => {
    audio.stopDrone();
    tRef.current = TIMELINE.fadeStart + 0.05;
    setT(tRef.current);
  };

  const toggleMute = () => {
    void audio.start();
    setMuted(audio.toggleMuted());
  };

  const overlayOpacity = clamp01(1 - (t - TIMELINE.fadeStart) / TIMELINE.fadeDur);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-surface-900 text-white"
      style={{ opacity: overlayOpacity }}
    >
      <AmbientField className="absolute inset-0" density={0.5} drift={1} />

      <NotebookScene t={t} />
      <MindLinkScene t={t} />
      <DeskScene t={t} />
      <BrainScene t={t} />

      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/25">esc to skip</span>
      </div>

      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute intro audio' : 'Mute intro audio'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        >
          {muted ? (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M10.5 5.25L5.25 9H3.75A.75.75 0 003 9.75v4.5c0 .414.336.75.75.75h1.5l5.25 3.75V5.25z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={skip}
          className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/60 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        >
          Skip
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 5.75v12.5c0 .97 1.1 1.54 1.88 1L16 13.5v4.75a.75.75 0 001.5 0v-12.5a.75.75 0 00-1.5 0v4.75L7.88 4.75C7.1 4.21 6 4.78 6 5.75z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
