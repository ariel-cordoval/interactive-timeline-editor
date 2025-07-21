import React from 'react';
import { TimelineTrack, TimelineClip, TimelineGroup, DragState, SnapState, RangeSelection } from '../types/timeline';
import TimelineClipComponent from '../TimelineClip';

interface TrackRowProps {
  track: TimelineTrack;
  clips: TimelineClip[];
  onClipClick: (clipId: string, event: React.MouseEvent) => void;
  onClipMouseDown: (clipId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  timeToPixel: (time: number) => number;
  zoomLevel: number;
  snapState: SnapState;
  dragState: DragState;
  isDropTarget: boolean;
  isValidDropTarget: boolean;
  groups: TimelineGroup[];
  rangeSelection: RangeSelection | null;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onGroupClick: (groupId: string, event: React.MouseEvent) => void;
  onGroupMouseDown: (groupId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  onExpandGroup: (groupId: string) => void;
  onCollapseGroup: (groupId: string) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  clips,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  dragState,
  isDropTarget,
  isValidDropTarget,
  groups,
  rangeSelection,
  onRangeSelect,
  onGroupClick,
  onGroupMouseDown,
  onExpandGroup,
  onCollapseGroup,
}) => {
  // Filter clips that belong to collapsed groups
  const visibleClips = clips.filter(clip => {
    if (!clip.groupId) return true;
    
    const group = groups.find(g => g.id === clip.groupId);
    return !group || !group.collapsed;
  });

  // Get collapsed groups for this track
  const collapsedGroups = groups.filter(group => 
    group.trackId === track.id && group.collapsed
  );

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

  const renderClip = (clip: TimelineClip) => {
    const clipWidth = timeToPixel(clip.duration);
    const clipLeft = timeToPixel(clip.startTime);

    const isSelected = clip.selected;
    const isDragging = dragState.isDragging && dragState.selectedClipIds.includes(clip.id);

    return (
      <div
        key={clip.id}
        className={`absolute top-1 ${isDragging ? 'opacity-75' : ''}`}
        style={{
          left: `${clipLeft}px`,
          width: `${clipWidth}px`,
          height: `${track.height - 4}px`,
        }}
      >
        <TimelineClipComponent
          id={clip.id}
          fileName={clip.name}
          duration={clip.duration}
          startTime={clip.startTime}
          width={clipWidth}
          selected={isSelected}
          waveformData={clip.waveformData}
          waveformColor={clip.waveformColor}
          onClipSelect={(clipId, event) => onClipClick(clipId, event)}
                     onRangeSelect={(clipId: string, startOffset: number, endOffset: number) => onRangeSelect(clipId, startOffset, endOffset)}
          onClipSplit={(clipId, splitPoint) => {
            // Convert split point to range for consistency
            const splitDuration = 0.1;
            const startOffset = Math.max(0, splitPoint - splitDuration / 2);
            const endOffset = Math.min(clip.duration, splitPoint + splitDuration / 2);
            onRangeSelect(clipId, startOffset, endOffset);
          }}
          onClipDelete={(clipId) => {
            // Select and delete entire clip
            onClipClick(clipId, { stopPropagation: () => {} } as React.MouseEvent);
          }}
          onClipMouseDown={(e) => onClipMouseDown(clip.id, e, "move")}
        />
      </div>
    );
  };

  const renderCollapsedGroup = (group: TimelineGroup) => {
    const groupClips = clips.filter(clip => clip.groupId === group.id);
    if (groupClips.length === 0) return null;

    const startTime = Math.min(...groupClips.map(clip => clip.startTime));
    const endTime = Math.max(...groupClips.map(clip => clip.endTime));
    const duration = endTime - startTime;
    
    const groupWidth = timeToPixel(duration);
    const groupLeft = timeToPixel(startTime);
    const groupHeight = track.height - 4;

    return (
      <div
        key={group.id}
        data-group-id={group.id}
        className="absolute top-1 cursor-pointer rounded-md border-2 border-[#555] bg-[#2a2a2a] overflow-hidden"
        style={{
          left: `${groupLeft}px`,
          width: `${groupWidth}px`,
          height: `${groupHeight}px`,
        }}
        onClick={(e) => onGroupClick(group.id, e)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            onGroupMouseDown(group.id, e, "move");
          }
        }}
        onDoubleClick={() => onExpandGroup(group.id)}
      >
        <div className="p-2 h-full flex items-center">
          <div className="text-xs text-white font-medium truncate">
            {group.name} ({groupClips.length} clips)
          </div>
        </div>
        
        {/* Expand indicator */}
        <div className="absolute top-1 right-1 text-xs text-[#888] cursor-pointer">
          ▼
        </div>
      </div>
    );
  };

  return (
    <div
      className={`
        relative h-[66px] border-b border-[#2b2b2b] bg-[#161616]
        ${isDropTarget ? (isValidDropTarget ? 'bg-green-900' : 'bg-red-900') : ''}
      `}
    >
      {/* Render visible clips */}
      {visibleClips.map(renderClip)}
      
      {/* Render collapsed groups */}
      {collapsedGroups.map(renderCollapsedGroup)}
    </div>
  );
};

export default TrackRow; 