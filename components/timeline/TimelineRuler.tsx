import React from 'react';

interface TimelineRulerProps {
  timeToPixel: (time: number) => number;
  totalDuration: number;
  zoomLevel: number;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  timeToPixel,
  totalDuration,
  zoomLevel,
}) => {
  // Calculate appropriate time intervals based on zoom level
  const getTimeInterval = (zoom: number): number => {
    if (zoom >= 2) return 1; // 1 second intervals at high zoom
    if (zoom >= 1.5) return 2; // 2 second intervals
    if (zoom >= 1) return 5; // 5 second intervals
    if (zoom >= 0.5) return 10; // 10 second intervals
    return 20; // 20 second intervals at low zoom
  };

  const timeInterval = getTimeInterval(zoomLevel);
  const markerCount = Math.ceil(totalDuration / timeInterval) + 1;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-8 bg-[#1a1a1a] border-b border-[#2b2b2b]">
      {/* Time markers */}
      <div className="relative h-full">
        {Array.from({ length: markerCount }, (_, i) => {
          const time = i * timeInterval;
          if (time > totalDuration + 10) return null; // Don't render beyond reasonable bounds
          
          const x = timeToPixel(time);
          
          return (
            <div
              key={i}
              className="absolute top-0 h-full flex flex-col justify-end text-[#888888]"
              style={{ left: `${x + 40}px` }} // Offset for track labels
            >
              {/* Major tick mark */}
              <div className="w-px h-3 bg-[#666666] mb-1" />
              
              {/* Time label */}
              <span className="text-xs text-center -ml-6 w-12">
                {formatTime(time)}
              </span>
            </div>
          );
        })}

        {/* Minor tick marks for finer detail at higher zoom */}
        {zoomLevel >= 1.5 && Array.from({ length: markerCount * 5 }, (_, i) => {
          const time = (i * timeInterval) / 5;
          if (time > totalDuration + 10) return null;
          if (time % timeInterval === 0) return null; // Skip major ticks
          
          const x = timeToPixel(time);
          
          return (
            <div
              key={`minor-${i}`}
              className="absolute bottom-1 w-px h-1.5 bg-[#444444]"
              style={{ left: `${x + 40}px` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TimelineRuler; 