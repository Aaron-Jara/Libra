/** ElevenLabs voice_settings.speed allowed range: 0.7–1.2 */
export const NARRATION_SPEED_STEPS = [0.8, 0.9, 1, 1.1, 1.2] as const;

export type NarrationSpeed = (typeof NARRATION_SPEED_STEPS)[number];

export function snapNarrationSpeed(value: number): NarrationSpeed {
  let closest: NarrationSpeed = 1;
  let minDiff = Infinity;

  for (const step of NARRATION_SPEED_STEPS) {
    const diff = Math.abs(value - step);
    if (diff < minDiff) {
      minDiff = diff;
      closest = step;
    }
  }

  return closest;
}

export function formatNarrationSpeed(speed: number): string {
  return `${speed}x`;
}
