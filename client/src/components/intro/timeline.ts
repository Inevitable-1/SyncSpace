import { clamp01 } from './geometry';

export const TIMELINE = {
  noteStart: 0,
  noteEnd: 1.5,
  glowEnd: 2.2,
  mindStart: 2.1,
  mindEnd: 4.8,
  deskStart: 4.7,
  deskEnd: 6.1,
  brainStart: 6.0,
  brainEnd: 10.4,
  fadeStart: 10.3,
  fadeDur: 0.75,
  total: 11.05,
} as const;

export function windowOpacity(
  t: number,
  start: number,
  end: number,
  fadeIn = 0.3,
  fadeOut = 0.35,
): number {
  if (t < start) return 0;
  const inP = clamp01((t - start) / fadeIn);
  const outP = clamp01((end - t) / fadeOut);
  return inP * outP;
}

export function windowProgress(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start));
}
