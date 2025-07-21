import React, { useCallback } from "react";
import { TimelineTrack, TimelineClip as TimelineClipType, TimelineGroup, SnapState, DragState, RangeSelection } from "../types/timeline";
import GroupTrackRow from "./GroupTrackRow";
import InteractiveTrack from "./InteractiveTrack";

interface TrackRowProps {
  track: TimelineTrack;
  clips: TimelineClipType[];
  onClipClick: (
    clipId: string,
    event: React.MouseEvent,
  ) => void;
  onClipMouseDown: (
    clipId: string,
    event: React.MouseEvent,
    dragType: "move" | "trim-start" | "trim-end",
  ) => void;
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

export default function TrackRow({
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
}: TrackRowProps) {
  // Handle clicks on track areas - let the main background handler deal with deselection
  const handleTrackClick = useCallback((_event: React.MouseEvent) => {
    // Don't interfere with clip interactions - let the improved background handler
    // determine if deselection should happen based on what was clicked
  }, []);

  // Find collapsed groups that belong to this track (expanded groups are rendered separately)
  const trackGroups = groups.filter(group => group.trackId === track.id && group.collapsed);

  return (
    <div
      className={`mb-1 h-[65px] relative transition-all duration-200 select-none ${
        isDropTarget && isValidDropTarget
          ? "bg-[#151515] border border-[#2b2b2b]"
          : ""
      }`}
      onClick={handleTrackClick}
    >
      {/* Render collapsed groups first */}
      {trackGroups.map((group) => {
        // Get all clips in this group
        const groupClips = clips.filter(clip => clip.groupId === group.id);
        if (groupClips.length === 0) return null;
        
        // Calculate group bounds
        const groupStartTime = Math.min(...groupClips.map(c => c.startTime));
        const groupEndTime = Math.max(...groupClips.map(c => c.endTime));
        const groupDuration = groupEndTime - groupStartTime;
        const groupWidth = timeToPixel(groupDuration);
        
        // Check if group is selected
        const isGroupSelected = group.clipIds.every(clipId =>
          clips.some(clip => clip.id === clipId && clip.selected)
        );

        const isSnappingToThis = snapState.isSnapping && 
          groupClips.some(clip => snapState.targetClipId === clip.id);
        const isBeingDragged = groupClips.some(clip => 
          dragState.selectedClipIds.includes(clip.id));

        return (
          <div
            key={`group-${group.id}`}
            className={`absolute top-0 h-full transition-all duration-200 select-none ${
              isBeingDragged ? "opacity-80" : ""
            } ${isSnappingToThis ? "ring-2 ring-purple-400" : ""}`}
            style={{
              left: `${timeToPixel(groupStartTime)}px`,
              width: `${groupWidth}px`,
              zIndex: isGroupSelected ? 15 : 10,
              transform: `scaleX(${zoomLevel})`,
            }}
            data-group-id={group.id}
          >
            <GroupTrackRow
              group={group}
              clips={groupClips}
              onGroupClick={onGroupClick}
              onGroupMouseDown={onGroupMouseDown}
              onExpandGroup={onExpandGroup}
              onCollapseGroup={onCollapseGroup}
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
            />
          </div>
        );
      })}

      {/* Render individual clips that aren't in collapsed groups */}
      {clips.map((clip) => {
        const group = clip.groupId ? groups.find((g) => g.id === clip.groupId) : null;
        const isGrouped = Boolean(group);
        
        // If this clip belongs to a collapsed group, skip rendering individual clip
        // (the group will be rendered above)
        if (group && group.collapsed) {
          return null;
        }
        
        return (
          <InteractiveTrack
            key={clip.id}
            clip={clip}
            onClipClick={onClipClick}
            onClipMouseDown={onClipMouseDown}
            timeToPixel={timeToPixel}
            isDragging={dragState.selectedClipIds.includes(
              clip.id,
            )}
            zoomLevel={zoomLevel}
            snapState={snapState}
            dragState={dragState}
            isGrouped={isGrouped}
            onRangeSelect={onRangeSelect}
            onRangeSplit={onRangeSplit}
            onRangeDelete={onRangeDelete}
            rangeSelection={rangeSelection}
          />
        );
      })}
    </div>
  );
} 