import React, { useCallback } from "react";
import TimelineClipComponent from "../TimelineClip";
import { TimelineClip as TimelineClipType, SnapState, DragState } from "../types/timeline";

interface InteractiveTrackProps {
  clip: TimelineClipType;
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
  isDragging: boolean;
  zoomLevel: number;
  snapState: SnapState;
  dragState: DragState;
  isGrouped: boolean;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  rangeSelection: { clipId: string; startOffset: number; endOffset: number; } | null;
}

export default function InteractiveTrack({
  clip,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  isDragging,
  zoomLevel: _zoomLevel, // Rename to indicate it's intentionally unused for now
  snapState,
  dragState,
  isGrouped,
  onRangeSelect,
  onRangeSplit,
  onRangeDelete,
  rangeSelection,
}: InteractiveTrackProps) {
  const isSnappingToThis =
    snapState.isSnapping && snapState.targetClipId === clip.id;
  const isBeingDragged = dragState.selectedClipIds.includes(
    clip.id,
  );

  // Handle clip selection
  const handleClipSelect = useCallback((clipId: string, event: React.MouseEvent) => {
    onClipClick(clipId, event);
  }, [onClipClick]);

  // Handle range selection - store for future operations
  const handleRangeSelect = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    onRangeSelect(clipId, startOffset, endOffset);
  }, [onRangeSelect]);

  // Handle clip split - use range if available
  const handleClipSplit = useCallback((clipId: string, splitPoint: number) => {
    if (rangeSelection && rangeSelection.clipId === clipId) {
      // Use range-based split
      onRangeSplit(clipId, rangeSelection.startOffset, rangeSelection.endOffset);
    } else {
      // Regular point split
      console.log(`✂️ Point split: ${clipId} at ${splitPoint.toFixed(2)}s`);
      // TODO: Implement point-based split if needed
    }
  }, [rangeSelection, onRangeSplit]);

  // Handle clip delete - use range if available  
  const handleClipDelete = useCallback((clipId: string) => {
    if (rangeSelection && rangeSelection.clipId === clipId) {
      // Use range-based delete
      onRangeDelete(clipId, rangeSelection.startOffset, rangeSelection.endOffset);
    } else {
      // Regular clip delete - select and delete
      onClipClick(clipId, { stopPropagation: () => {} } as React.MouseEvent);
      // The delete will be handled by keyboard shortcut or external delete function
    }
  }, [rangeSelection, onRangeDelete, onClipClick]);

  return (
    <div
      className={`absolute top-0 h-full transition-all duration-200 select-none ${
        isDragging && isBeingDragged ? "opacity-80" : ""
      } ${isSnappingToThis ? "ring-2 ring-purple-400" : ""} ${
        isGrouped
          ? "ring-1 ring-purple-400 ring-opacity-50"
          : ""
      }`}
      style={{
        left: `${timeToPixel(clip.startTime)}px`,
        width: `${timeToPixel(clip.duration)}px`,
        zIndex: clip.selected ? 15 : 10,
      }}
      data-clip-id={clip.id}
    >
      {/* Use our new TimelineClip component */}
      <TimelineClipComponent
        id={clip.id}
        fileName={clip.name}
        duration={clip.duration}
        startTime={clip.startTime}
        width={timeToPixel(clip.duration)}
        selected={clip.selected}
        waveformData={clip.waveformData}
        waveformColor={clip.waveformColor}
        onClipSelect={handleClipSelect}
        onRangeSelect={handleRangeSelect}
        onClipSplit={handleClipSplit}
        onClipDelete={handleClipDelete}
        onClipMouseDown={(e: React.MouseEvent) => onClipMouseDown(clip.id, e, "move")}
      />

      {/* Group Indicator */}
      {isGrouped && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white flex items-center justify-center z-30">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      )}

      {/* Interactive Overlay for trim functionality */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Trim Areas - visible on selected clips */}
        {clip.selected && !dragState.isDragging && (
          <>
            {/* Left trim area */}
            <div
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize pointer-events-auto hover:bg-purple-400 hover:bg-opacity-30 transition-colors"
              onMouseDown={(e) => {
                e.stopPropagation();
                onClipMouseDown(clip.id, e, "trim-start");
              }}
            />
            
            {/* Right trim area */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize pointer-events-auto hover:bg-purple-400 hover:bg-opacity-30 transition-colors"
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
} 