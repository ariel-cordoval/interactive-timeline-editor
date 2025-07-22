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
  rangeSelection: _rangeSelection, // Renamed to indicate intentionally unused
  onRangeSelect,
  onGroupClick,
  onGroupMouseDown,
  onExpandGroup,
  onCollapseGroup: _onCollapseGroup, // Renamed to indicate intentionally unused
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
        relative h-[66px] border-b border-[#2b2b2b] bg-[#161616] transition-all duration-150
        ${isDropTarget ? (isValidDropTarget 
          ? 'bg-green-900/40 border-green-500 border-2 shadow-lg' 
          : 'bg-red-900/40 border-red-500 border-2') : ''}
      `}
    >
      {/* Drop indicator overlay */}
      {isDropTarget && isValidDropTarget && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full border-2 border-dashed border-green-400 rounded-md bg-green-500/10 flex items-center justify-center">
            <div className="text-green-400 text-sm font-medium px-2 py-1 bg-black/50 rounded flex items-center gap-2">
              <span>↓</span>
              <span>{dragState.collisionDetected ? 'Will push clips down' : 'Drop here'}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Invalid drop indicator */}
      {isDropTarget && !isValidDropTarget && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full border-2 border-dashed border-red-400 rounded-md bg-red-500/10 flex items-center justify-center">
            <div className="text-red-400 text-sm font-medium px-2 py-1 bg-black/50 rounded">
              Conflicts detected
            </div>
          </div>
        </div>
      )}

      {/* Render visible clips */}
      {visibleClips.map(renderClip)}
      
      {/* Render collapsed groups */}
      {collapsedGroups.map(renderCollapsedGroup)}
    </div>
  );
};

export default TrackRow; 