import React from 'react';
import { SnapState } from '../types/timeline';

interface SnapIndicatorProps {
  timeToPixel: (time: number) => number;
  snapState: SnapState;
}

const SnapIndicator: React.FC<SnapIndicatorProps> = ({
  timeToPixel,
  snapState,
}) => {
  if (!snapState.isSnapping || snapState.snapPosition === null) {
    return null;
  }

  const snapX = timeToPixel(snapState.snapPosition);

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-30"
      style={{ left: `${snapX}px` }}
    >
      {/* Snap line */}
      <div className="w-0.5 h-full bg-yellow-400 opacity-80" />
      
      {/* Snap indicator dot */}
      <div 
        className="absolute -top-1 -left-1.5 w-3 h-3 bg-yellow-400 rounded-full opacity-80"
      />
      
      {/* Optional snap tooltip */}
      {snapState.snapType && (
        <div 
          className="absolute -top-8 -left-8 px-2 py-1 bg-yellow-400 text-black text-xs rounded whitespace-nowrap"
        >
          {snapState.snapType === 'start' ? 'Snap to start' : 'Snap to end'}
        </div>
      )}
    </div>
  );
};

export default SnapIndicator; 