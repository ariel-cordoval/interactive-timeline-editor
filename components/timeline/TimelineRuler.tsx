import React from "react";

interface TimelineRulerProps {
  timeToPixel: (time: number) => number;
  totalDuration: number;
  zoomLevel: number;
}

export default function TimelineRuler({
  timeToPixel,
  totalDuration,
  zoomLevel,
}: TimelineRulerProps) {
  const timemarks = [];
  const visibleDuration = totalDuration / zoomLevel; // Match main timeline calculation
  
  // Calculate appropriate interval based on visible duration and zoom level
  let interval = 1; // Start with 1 second
  
  // Adaptive interval based on visible duration to prevent overcrowding
  if (visibleDuration > 600) interval = 60;      // 1 minute for very long durations
  else if (visibleDuration > 300) interval = 30; // 30s for long durations  
  else if (visibleDuration > 120) interval = 15; // 15s for medium durations
  else if (visibleDuration > 60) interval = 10;  // 10s for moderate durations
  else if (visibleDuration > 30) interval = 5;   // 5s for shorter durations
  else if (visibleDuration > 15) interval = 2;   // 2s for short durations
  else interval = 1;                              // 1s for very short durations
  
  // Generate time marks within visible duration
  for (let i = 0; i <= visibleDuration; i += interval) {
    if (i <= totalDuration) { // Don't show markers beyond actual content
      timemarks.push(i);
    }
  }

  return (
    <div className="relative h-6 bg-[#0d0d0d] border-b border-[#2b2b2b]">
      {timemarks.map((time) => (
        <div
          key={time}
          className="absolute top-0 bottom-0 flex flex-col items-center justify-center text-xs text-[#555555]"
          style={{ left: `${40 + timeToPixel(time)}px` }}
        >
          <div className="h-2 w-px bg-[#2b2b2b] mb-1" />
          <span className="font-medium">
            {String(Math.floor(time / 60)).padStart(2, "0")}:
            {String(Math.floor(time % 60)).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
} 