import React from 'react';
import { TimelineTrack, TimelineClip, TimelineGroup, DragState, SnapState, RangeSelection } from '../types/timeline';
import TimelineClipComponent from '../TimelineClip';
import GroupTrackRow from './GroupTrackRow';

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
  zoomLevel,
  snapState,
  dragState,
  isDropTarget,
  isValidDropTarget,
  groups,
  rangeSelection,
  onRangeSelect,
  onRangeSplit,
  onRangeDelete,
  onGroupClick,
  onGroupMouseDown,
  onExpandGroup,
  onCollapseGroup,
}) => {
  // Get groups for this track
  const trackGroups = groups.filter(group => group.trackId === track.id);
  
  // Get clips that are not in any group
  const ungroupedClips = clips.filter(clip => !clip.groupId);

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

      {/* Render Groups */}
      {trackGroups.map(group => {
        const groupClips = clips.filter(clip => clip.groupId === group.id);
        if (groupClips.length === 0) {
          return null;
        }

        // Check if group is selected (all clips in group are selected)
        const isGroupSelected = group.clipIds.every(clipId =>
          clips.some(clip => clip.id === clipId && clip.selected)
        );
        return (
          <GroupTrackRow
            key={`group-${group.id}`}
            group={group}
            clips={groupClips}
            onGroupClick={onGroupClick}
            onGroupMouseDown={onGroupMouseDown}
            onClipClick={onClipClick}
            onClipMouseDown={onClipMouseDown}
            timeToPixel={timeToPixel}
            zoomLevel={zoomLevel}
            snapState={snapState}
            dragState={dragState}
            selected={isGroupSelected}
            rangeSelection={rangeSelection}
            onRangeSelect={onRangeSelect}
            onRangeSplit={onRangeSplit}
            onRangeDelete={onRangeDelete}
            onExpandGroup={onExpandGroup}
            onCollapseGroup={onCollapseGroup}
          />
        );
      })}

      {/* Render Ungrouped Clips */}
      {ungroupedClips.map(clip => {
        const clipWidth = timeToPixel(clip.duration);
        const clipLeft = timeToPixel(clip.startTime);
        const isDragging = dragState.isDragging && dragState.selectedClipIds.includes(clip.id);

        return (
          <div
            key={`clip-${clip.id}`}
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
              selected={clip.selected}
              waveformData={clip.waveformData}
              waveformColor={clip.waveformColor}
              onClipSelect={onClipClick}
              onRangeSelect={onRangeSelect}
              onClipSplit={(clipId, splitPoint) => {
                // Convert split point to range for consistency
                const splitDuration = 0.1;
                const startOffset = Math.max(0, splitPoint - splitDuration / 2);
                const endOffset = Math.min(clip.duration, splitPoint + splitDuration / 2);
                onRangeSelect(clipId, startOffset, endOffset);
              }}
              onClipDelete={(clipId) => {
                onClipClick(clipId, { stopPropagation: () => {} } as React.MouseEvent);
              }}
              onClipMouseDown={(e) => {
                onClipMouseDown(clip.id, e, "move");
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TrackRow; 