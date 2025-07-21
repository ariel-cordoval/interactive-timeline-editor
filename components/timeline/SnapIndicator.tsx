import React from "react";
import { SnapState } from "../types/timeline";

interface SnapIndicatorProps {
  timeToPixel: (time: number) => number;
  snapState: SnapState;
}

export default function SnapIndicator({
  timeToPixel,
  snapState,
}: SnapIndicatorProps) {
  if (!snapState.isSnapping || snapState.snapPosition === null)
    return null;

  return (
    <div
      className="absolute top-[78px] bottom-0 w-0.5 bg-purple-400 z-30 transition-all duration-150"
      style={{
        left: `${40 + timeToPixel(snapState.snapPosition)}px`,
      }}
    >
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400 rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full" />
    </div>
  );
} 