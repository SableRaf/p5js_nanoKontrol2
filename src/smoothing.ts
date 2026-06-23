// Smoothing helpers.

import type { EasingType } from './types';

// Easing functions — receive the raw speed/blend factor t (0..1).
export const EASING: Record<EasingType, (t: number) => number> = {
  lerp: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

// Convert a duration in ms to a per-frame blend factor assuming 60 fps.
// A shorter duration → larger t → faster convergence.
export function durationToSpeed(ms: number): number {
  const frames = Math.max(1, (ms / 1000) * 60);
  return 1 - Math.pow(0.05, 1 / frames);
}
