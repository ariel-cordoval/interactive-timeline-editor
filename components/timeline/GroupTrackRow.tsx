import React from 'react';
import { 
  TimelineClip, 
  TimelineGroup, 
  SnapState, 
  DragState, 
  RangeSelection 
} from '../types/timeline';
import { ChevronUp } from 'lucide-react';

interface GroupTrackRowProps {
  group: TimelineGroup;
  clips: TimelineClip[];
  onGroupClick: (groupId: string, event: React.MouseEvent) => void;
  onGroupMouseDown: (groupId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  onExpandGroup: (groupId: string) => void;
  onCollapseGroup: (groupId: string) => void;
  onClipClick: (clipId: string, event: React.MouseEvent) => void;
  onClipMouseDown: (clipId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  timeToPixel: (time: number) => number;
  zoomLevel: number;
  snapState: SnapState;
  dragState: DragState;
  selected: boolean;
  rangeSelection: RangeSelection | null;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
}

const GroupTrackRow: React.FC<GroupTrackRowProps> = ({
  group,
  clips,
  onGroupClick,
  onGroupMouseDown,
  onCollapseGroup,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  dragState,
  selected,
  rangeSelection,
}) => {
  // Sort clips by their original track index for proper display
  const sortedClips = [...clips].sort((a, b) => {
    const aIndex = a.groupTrackIndex || 0;
    const bIndex = b.groupTrackIndex || 0;
    return aIndex - bIndex;
  });

  const renderWaveform = (clip: TimelineClip, clipWidth: number, clipHeight: number) => {
    if (!clip.waveformData || !(clip.waveformData instanceof Float32Array)) {
      return null;
    }

    const waveformData = clip.waveformData;
    const samplesPerPixel = waveformData.length / clipWidth;
    const centerY = clipHeight / 2;
    const maxAmplitude = Math.max(...Array.from(waveformData));

    // Generate path for waveform
    let pathData = '';
    for (let x = 0; x < clipWidth; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const amplitude = waveformData[sampleIndex] || 0;
      const normalizedAmplitude = amplitude / maxAmplitude;
      const y = centerY - (normalizedAmplitude * centerY * 0.8);
      
      if (x === 0) {
        pathData += `M ${x} ${centerY}`;
      }
      pathData += ` L ${x} ${y}`;
    }
    
    // Complete the waveform shape
    pathData += ` L ${clipWidth} ${centerY}`;
    for (let x = clipWidth - 1; x >= 0; x--) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const amplitude = waveformData[sampleIndex] || 0;
      const normalizedAmplitude = amplitude / maxAmplitude;
      const y = centerY + (normalizedAmplitude * centerY * 0.8);
      pathData += ` L ${x} ${y}`;
    }
    pathData += ' Z';

    return (
      <svg
        width={clipWidth}
        height={clipHeight}
        className="absolute inset-0 pointer-events-none"
      >
        <path
          d={pathData}
          fill={clip.waveformColor || clip.color}
          opacity={0.6}
        />
      </svg>
    );
  };

  const renderClip = (clip: TimelineClip, trackIndex: number) => {
    const clipWidth = timeToPixel(clip.duration);
    const clipLeft = timeToPixel(clip.startTime);
    const clipHeight = 60; // Standard clip height
    const trackY = 30 + (trackIndex * 66); // Header height + track spacing

    const isSelected = clip.selected;
    const isDragging = dragState.isDragging && dragState.selectedClipIds.includes(clip.id);
    
    // Check if this clip has a range selection
    const hasRangeSelection = rangeSelection?.clipId === clip.id;

    return (
      <div
        key={clip.id}
        data-clip-id={clip.id}
        className={`
          absolute cursor-pointer rounded-md border border-[#333] overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
          ${isDragging ? 'opacity-75' : ''}
        `}
        style={{
          left: `${clipLeft}px`,
          top: `${trackY}px`,
          width: `${clipWidth}px`,
          height: `${clipHeight}px`,
          backgroundColor: clip.color,
        }}
        onClick={(e) => onClipClick(clip.id, e)}
        onMouseDown={(e) => {
          if (e.button === 0) { // Left mouse button
            onClipMouseDown(clip.id, e, "move");
          }
        }}
      >
        {/* Clip content */}
        <div className="relative w-full h-full">
          {/* Waveform */}
          {renderWaveform(clip, clipWidth, clipHeight)}
          
          {/* Clip name */}
          <div className="absolute top-1 left-2 text-xs text-white font-medium truncate max-w-[calc(100%-16px)] pointer-events-none">
            {clip.name}
          </div>
          
          {/* Range selection overlay */}
          {hasRangeSelection && (
            <div
              className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-30 border-l-2 border-r-2 border-blue-500"
              style={{
                left: `${(rangeSelection.startOffset / clip.duration) * clipWidth}px`,
                width: `${((rangeSelection.endOffset - rangeSelection.startOffset) / clip.duration) * clipWidth}px`,
              }}
            />
          )}
          
          {/* Resize handles */}
          {isSelected && !isDragging && (
            <>
              <div
                className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize bg-transparent hover:bg-blue-400 hover:bg-opacity-50"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onClipMouseDown(clip.id, e, "trim-start");
                }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize bg-transparent hover:bg-blue-400 hover:bg-opacity-50"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onClipMouseDown(clip.id, e, "trim-end");
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // Calculate group dimensions
  const startTime = Math.min(...clips.map(clip => clip.startTime));
  const endTime = Math.max(...clips.map(clip => clip.endTime));
  const groupWidth = timeToPixel(endTime - startTime);
  const groupLeft = timeToPixel(startTime);
  
  // Calculate number of tracks needed
  const maxTrackIndex = Math.max(...clips.map(clip => clip.groupTrackIndex || 0));
  const trackCount = maxTrackIndex + 1;
  const totalHeight = 30 + (trackCount * 66); // Header + tracks

  return (
    <div
      className={`
        absolute bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden
        ${selected ? 'ring-2 ring-blue-400' : ''}
      `}
      style={{
        left: `${groupLeft}px`,
        top: '66px', // Position below main track
        width: `${groupWidth + 20}px`, // Extra padding
        height: `${totalHeight}px`,
        zIndex: 10,
      }}
      data-group-id={group.id}
    >
      {/* Group header */}
      <div 
        className="h-[30px] bg-[#2a2a2a] border-b border-[#333] flex items-center justify-between px-3 cursor-pointer"
        onClick={(e) => onGroupClick(group.id, e)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            onGroupMouseDown(group.id, e, "move");
          }
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCollapseGroup(group.id);
            }}
            className="text-[#888] hover:text-white"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <span className="text-xs text-white font-medium">
            {group.name} ({clips.length} clips)
          </span>
        </div>
        
        <div className="text-xs text-[#666]">
          Group
        </div>
      </div>

      {/* Group tracks */}
      <div className="relative">
        {/* Track separators */}
        {Array.from({ length: trackCount }, (_, i) => (
          <div
            key={i}
            className="absolute border-b border-[#2b2b2b]"
            style={{
              top: `${30 + (i * 66)}px`,
              left: 0,
              right: 0,
              height: '66px',
            }}
          />
        ))}

        {/* Render clips */}
        {sortedClips.map(clip => 
          renderClip(clip, clip.groupTrackIndex || 0)
        )}
      </div>
    </div>
  );
};

export default GroupTrackRow; 