import type { EasingType } from './types';
export declare const EASING: Record<EasingType, (t: number) => number>;
export declare function durationToSpeed(ms: number): number;
