"use client";

import { Gauge } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatNarrationSpeed,
  NARRATION_SPEED_STEPS,
  type NarrationSpeed,
} from "@/lib/narration-speed";

type NarrationSpeedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speed: NarrationSpeed;
  onSpeedChange: (speed: NarrationSpeed) => void;
};

export function NarrationSpeedModal({
  open,
  onOpenChange,
  speed,
  onSpeedChange,
}: NarrationSpeedModalProps) {
  const sliderIndex = useMemo(
    () => NARRATION_SPEED_STEPS.indexOf(speed),
    [speed],
  );

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.value);
      const next = NARRATION_SPEED_STEPS[index] ?? 1;
      onSpeedChange(next);
    },
    [onSpeedChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="z-[105]" className="z-[110] sm:max-w-sm">
        <DialogHeader className="px-6 pt-6 pb-2 text-left">
          <DialogTitle>Narration speed</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Adjust how fast your critic speaks (0.8x–1.2x). Changes apply
            immediately without restarting playback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-6">
          <div className="flex items-center justify-center">
            <span className="font-display text-3xl tracking-tight text-foreground">
              {formatNarrationSpeed(speed)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={NARRATION_SPEED_STEPS.length - 1}
            step={1}
            value={sliderIndex >= 0 ? sliderIndex : NARRATION_SPEED_STEPS.indexOf(1)}
            onChange={handleSliderChange}
            className="w-full accent-primary"
            aria-label="Narration speed"
            aria-valuetext={formatNarrationSpeed(speed)}
          />

          <div className="flex justify-between text-[10px] text-muted-foreground">
            {NARRATION_SPEED_STEPS.map((step) => (
              <span key={step}>{step}x</span>
            ))}
          </div>

          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NarrationSpeedButton({
  speed,
  onClick,
}: {
  speed: NarrationSpeed;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="h-12 shrink-0 rounded-xl gap-1.5 px-3"
      onClick={onClick}
      aria-label={`Narration speed ${formatNarrationSpeed(speed)}`}
    >
      <Gauge className="size-4" />
      <span className="text-xs font-medium tabular-nums">{speed}x</span>
    </Button>
  );
}
