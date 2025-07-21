import React, { useState, useRef, useCallback, useEffect } from "react";
import { TimelineGroup, TimelineClip, SnapState, DragState } from "../types/timeline";
import TimelineClipComponent from "../TimelineClip";

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
  rangeSelection: { clipId: string; startOffset: number; endOffset: number; } | null;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
}

export default function GroupTrackRow({
  group,
  clips,
  onGroupClick,
  onGroupMouseDown,
  onExpandGroup,
  onCollapseGroup,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  zoomLevel,
  snapState,
  dragState,
  selected,
  rangeSelection: _rangeSelection, // Rename to indicate it's intentionally unused for now
  onRangeSelect,
  onRangeSplit,
  onRangeDelete,
}: GroupTrackRowProps) {
  // Add range selection state for collapsed groups
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Calculate tight group bounds (leftmost to rightmost)
  const groupStartTime = Math.min(...clips.map(c => c.startTime));
  const groupEndTime = Math.max(...clips.map(c => c.endTime));
  const groupDuration = groupEndTime - groupStartTime;
  const groupWidth = timeToPixel(groupDuration);
  
  const isSnappingToThis = snapState.isSnapping && 
    clips.some(clip => snapState.targetClipId === clip.id);
  const isBeingDragged = clips.some(clip => 
    dragState.selectedClipIds.includes(clip.id));

  // Handle content area interaction - works exactly like TimelineClip
  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    if (!contentRef.current || !group.collapsed) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = contentRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startOffset = (startX / rect.width) * groupDuration;
    const mouseDownTime = Date.now();
    const mouseDownX = e.clientX;
    const mouseDownY = e.clientY;
    
    // Start selection tracking
    setIsSelecting(true);
    setSelectionStart(startOffset);
    setSelectionEnd(startOffset);
    
    let hasMoved = false;
    let isRangeSelection = false;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!contentRef.current) return;
      
      // Check if this is actually a drag (moved more than 5 pixels)
      const deltaX = Math.abs(e.clientX - mouseDownX);
      const deltaY = Math.abs(e.clientY - mouseDownY);
      
      if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
        
        // Only start range selection if we're dragging horizontally more than vertically
        if (deltaX > Math.abs(deltaY)) {
          isRangeSelection = true;
          
          // Continue with range selection
          const rect = contentRef.current.getBoundingClientRect();
          const currentX = e.clientX - rect.left;
          const currentOffset = Math.max(0, Math.min(groupDuration, (currentX / rect.width) * groupDuration));
          setSelectionEnd(currentOffset);
          
          console.log(`📍 Range selecting: ${Math.min(startOffset, currentOffset).toFixed(2)}s - ${Math.max(startOffset, currentOffset).toFixed(2)}s`);
        }
      }
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
      const timeDelta = Date.now() - mouseDownTime;
      
      // If this was a simple click (no movement and quick), select the group
      if (!hasMoved && timeDelta < 500) {
        console.log('👆 Simple click in group content area - selecting group');
        setSelectionStart(null);
        setSelectionEnd(null);
        onGroupClick(group.id, e as any);
      } else if (isRangeSelection && selectionStart !== null && selectionEnd !== null) {
        // This was a horizontal drag for range selection
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);
        
        // Only trigger range select if there's a meaningful selection (> 0.2 seconds)
        if (Math.abs(end - start) > 0.2) {
          // Use the group ID as the clip ID for range operations
          onRangeSelect(group.id, start, end);
          console.log(`✂️ Selected range in group for editing: ${start.toFixed(2)}s - ${end.toFixed(2)}s (${Math.abs(end - start).toFixed(2)}s duration)`);
        } else {
          // Clear selection if it's too small
          setSelectionStart(null);
          setSelectionEnd(null);
          // If selection was too small, just select the group
          console.log('👆 Range too small - selecting group instead');
          onGroupClick(group.id, e as any);
        }
      } else if (hasMoved && !isRangeSelection) {
        // This was a vertical drag or other movement - just select the group
        console.log('👆 Non-range movement - selecting group');
        setSelectionStart(null);
        setSelectionEnd(null);
        onGroupClick(group.id, e as any);
      } else {
        // Clear any pending selections
        setSelectionStart(null);
        setSelectionEnd(null);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [group.collapsed, group.id, groupDuration, onRangeSelect, onGroupClick, selectionStart, selectionEnd]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Clear range selection when group is deselected
  useEffect(() => {
    if (!selected) {
      clearSelection();
    }
  }, [selected, clearSelection]);

  // Handle keyboard shortcuts for collapsed groups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected || !group.collapsed) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectionStart !== null && selectionEnd !== null) {
          // If there's a range selection, delete the selected range
          const start = Math.min(selectionStart, selectionEnd);
          const end = Math.max(selectionStart, selectionEnd);
          console.log(`🗑️ Delete selected range in group: ${start.toFixed(2)}s - ${end.toFixed(2)}s`);
          onRangeDelete(group.id, start, end);
          clearSelection();
        }
        // If no range selection, let the main delete handler handle group deletion
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectionStart !== null && selectionEnd !== null) {
          // Split at middle of range selection
          const splitPoint = (selectionStart + selectionEnd) / 2;
          console.log(`✂️ Split group at range selection: ${splitPoint.toFixed(2)}s`);
          onRangeSplit(group.id, splitPoint, splitPoint);
        }
        // If no range selection, let the main split handler handle playhead split
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Clear range selection on Escape
        console.log('🔄 Clear group range selection');
        clearSelection();
      }
    };

    if (selected && group.collapsed) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selected, group.collapsed, group.id, group.name, selectionStart, selectionEnd, groupDuration, onRangeDelete, onRangeSplit, clearSelection]);

  // Generate consistent colors for speakers
  const getSpeakerColor = (clipName: string, clipColor?: string) => {
    if (clipColor) return clipColor;
    
    // Generate consistent colors based on clip name
    const colors = [
      '#E961FF', // Purple (default)
      '#FF6B6B', // Red
      '#4ECDC4', // Teal  
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
      '#BB8FCE'  // Light Purple
    ];
    
    // Use a simple hash to consistently assign colors
    let hash = 0;
    for (let i = 0; i < clipName.length; i++) {
      hash = clipName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (group.collapsed) {
    // COLLAPSED STATE: Real combined waveform with speaker color coding
    const generateCombinedWaveform = () => {
      if (!clips.length) {
        console.log('❌ No clips found for waveform generation');
        return [];
      }
      
      const bars = [];
      const barCount = Math.max(20, Math.floor(groupWidth / 3)); // More bars for better resolution
      const segmentDuration = groupDuration / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const segmentTime = i * segmentDuration + groupStartTime;
        
        // Find which clips are active at this time and their contributions
        const activeClips = clips.filter(clip => {
          return segmentTime >= clip.startTime && segmentTime < clip.endTime;
        });
        
        // Calculate individual amplitudes and find dominant speaker
        const clipAmplitudes: Array<{
          clip: TimelineClip;
          amplitude: number;
          color: string;
        }> = [];
        
        // Removed excessive logging
        
        activeClips.forEach(clip => {
          if (clip.waveformData && clip.waveformData.length > 0) {
            const clipProgress = (segmentTime - clip.startTime) / clip.duration;
            const waveformIndex = Math.floor(clipProgress * clip.waveformData.length);
            if (waveformIndex >= 0 && waveformIndex < clip.waveformData.length) {
              const amplitude = clip.waveformData[waveformIndex];
              clipAmplitudes.push({
                clip,
                amplitude,
                color: getSpeakerColor(clip.name, clip.waveformColor)
              });
            }
          }
        });
        
        if (clipAmplitudes.length > 0) {
          // Find the dominant speaker (highest amplitude)
          const dominantSpeaker = clipAmplitudes.reduce((prev, current) => 
            current.amplitude > prev.amplitude ? current : prev
          );
          
          // Calculate combined amplitude (sum of all active clips)
          const totalAmplitude = clipAmplitudes.reduce((sum, item) => sum + item.amplitude, 0);
          const normalizedAmplitude = Math.min(1, totalAmplitude);
          
          // Use dominant speaker's color, with intensity based on their dominance
          const dominanceRatio = dominantSpeaker.amplitude / totalAmplitude;
          const barHeight = Math.max(2, normalizedAmplitude * 24);
          const opacity = 0.4 + (dominanceRatio * 0.6); // More dominant = more opaque
          
          bars.push({
            x: (i / barCount) * groupWidth,
            height: barHeight,
            opacity,
            color: dominantSpeaker.color,
            speakers: clipAmplitudes.map(ca => ca.clip.name || 'Unknown').join(', '),
            dominantSpeaker: dominantSpeaker.clip.name || 'Unknown'
          });
        } else {
          // No active clips - show minimal bar
          bars.push({
            x: (i / barCount) * groupWidth,
            height: 2,
            opacity: 0.2,
            color: '#666666',
            speakers: '',
            dominantSpeaker: ''
          });
        }
      }
      
      return bars;
    };

    const waveformBars = generateCombinedWaveform();

    return (
      <div className="mb-1 h-[65px] relative select-none">
        <div
          className={`absolute top-0 h-full transition-all duration-200 select-none ${
            isBeingDragged ? "opacity-80" : ""
          } ${isSnappingToThis ? "ring-2 ring-purple-400" : ""}`}
          style={{
            left: `${timeToPixel(groupStartTime)}px`,
            width: `${groupWidth}px`,
            zIndex: selected ? 15 : 10,
            transform: `scaleX(${zoomLevel})`,
          }}
          data-group-id={group.id}
        >
          {/* Collapsed Group - Styled exactly like TimelineClip */}
          <div
            className={`
              relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
              ${selected ? 'ring-2 ring-[#E961FF] ring-opacity-50' : ''}
              ${isBeingDragged ? 'opacity-80 scale-[0.98]' : ''}
            `}
            style={{ width: `${groupWidth}px` }}
            data-group-id={group.id}
          >
            {/* Header Area - Click to select, drag when selected */}
            <div
              className={`
                relative bg-[#2b2b2b] hover:bg-[#333333] transition-colors duration-150
                ${isBeingDragged ? 'cursor-grabbing' : selected ? 'cursor-grab' : 'cursor-pointer'}
              `}
              onClick={(e) => {
                // Handle group selection on header click
                if (!(e.target as HTMLElement).closest('button')) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('👆 Group header clicked - selecting group:', group.id);
                  onGroupClick(group.id, e);
                }
              }}
              onMouseDown={(e) => {
                // Don't drag if clicking on the expand button
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                
                // Only start drag if group is already selected
                if (selected) {
                  console.log('🖱️ Starting drag for selected group:', group.id);
                  e.preventDefault();
                  e.stopPropagation();
                  onGroupMouseDown(group.id, e, "move");
                } else {
                  // If not selected, just select it (click handler will take care of this)
                  console.log('👆 Group not selected, will select on click');
                }
              }}
            >
              <div className="flex items-center gap-2 px-2 py-1">
                {/* Expand/Collapse Arrow (instead of Audio Icon) */}
                <div className="w-4 h-4 rounded-sm bg-[#666666] shrink-0 flex items-center justify-center relative z-10">
                  <button
                    className="w-3 h-3 flex items-center justify-center rotate-[270deg] hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onExpandGroup(group.id);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    title="Expand group"
                  >
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                
                {/* Group Name (instead of File Name) - Draggable when selected */}
                <div 
                  className={`flex-1 min-w-0 ${selected ? 'cursor-grab' : 'cursor-pointer'}`}
                  onMouseDown={(e) => {
                    // Only start drag if group is already selected
                    if (selected) {
                      e.preventDefault();
                      e.stopPropagation();
                      onGroupMouseDown(group.id, e, "move");
                    }
                  }}
                >
                  <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
                    Tracks group
                  </p>
                </div>
                
                {/* Duration indicator - Draggable when selected */}
                <div 
                  className={`text-[#888888] text-[10px] shrink-0 ${selected ? 'cursor-grab' : 'cursor-pointer'}`}
                  onMouseDown={(e) => {
                    // Only start drag if group is already selected
                    if (selected) {
                      e.preventDefault();
                      e.stopPropagation();
                      onGroupMouseDown(group.id, e, "move");
                    }
                  }}
                >
                  {Math.floor(groupDuration)}s
                </div>
              </div>
            </div>

            {/* Content Area - Waveform & Selection (exactly like TimelineClip) */}
            <div
              ref={contentRef}
              className={`
                relative h-10 overflow-hidden
                transition-colors duration-150
                bg-[#1d1d1d] hover:bg-[#222222]
                ${isSelecting ? 'cursor-grabbing bg-[#252525]' : 'cursor-pointer hover:cursor-crosshair'}
                z-30 pointer-events-auto mx-1 select-none
              `}
              onMouseDown={handleContentMouseDown}
              title={`Group: Click to select • Drag to select range • Use all clip operations (split, trim, move)${clips.length > 1 ? ` • ${clips.length} tracks combined` : ''}`}
            >
              {/* Waveform Visualization */}
              <div className="flex items-center h-full px-1 py-1">
                <div className="h-full relative w-full">
                  <svg
                    className="w-full h-full"
                    viewBox={`0 0 ${groupWidth} 32`}
                    preserveAspectRatio="none"
                  >
                    {waveformBars.map((bar: any, index: number) => {
                      const barY = (32 - bar.height) / 2;
                      return (
                        <rect
                          key={index}
                          x={bar.x}
                          y={barY}
                          width="2"
                          height={bar.height}
                          fill={bar.color || "#E961FF"}
                          opacity={bar.opacity}
                          data-speaker={bar.dominantSpeaker || ''}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Selection Overlay */}
              {selectionStart !== null && selectionEnd !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-[#E961FF] bg-opacity-25 border border-[#E961FF] pointer-events-none transition-all duration-100 z-10"
                  style={{
                    left: `${Math.min(selectionStart, selectionEnd) / groupDuration * 100}%`,
                    width: `${Math.abs(selectionEnd - selectionStart) / groupDuration * 100}%`,
                  }}
                >
                  {/* Selection handles */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#E961FF] shadow-lg" />
                  <div className="absolute right-0 top-0 w-1 h-full bg-[#E961FF] shadow-lg" />
                  
                  {/* Selection duration indicator */}
                  {Math.abs(selectionEnd - selectionStart) > 0.5 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#E961FF] text-white text-xs px-1 py-0.5 rounded whitespace-nowrap pointer-events-none">
                      {Math.abs(selectionEnd - selectionStart).toFixed(1)}s
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Border overlay */}
            <div className="absolute inset-0 border border-[rgba(250,250,250,0.15)] rounded-lg pointer-events-none" />
            
            {/* Resize handles for trimming (exactly like TimelineClip) */}
            {selected && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onGroupMouseDown(group.id, e, "trim-start");
                  }} 
                />
                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onGroupMouseDown(group.id, e, "trim-end");
                  }} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // EXPANDED STATE: Stacked clips with group header - HUGS CONTENT TIGHTLY
    const clipHeight = 58; // Height for each clip in expanded view
    const headerHeight = 28; // Height for group header
    const clipSpacing = 4; // Spacing between clips
    
    // Calculate height based on actual track usage
    const usedTrackIndices = new Set(
      clips.map(clip => clip.groupTrackIndex ?? clips.indexOf(clip))
    );
    const maxTrackIndex = Math.max(...Array.from(usedTrackIndices), 0);
    const numTracksToShow = maxTrackIndex + 2; // Used tracks plus one extra
    
    const totalHeight = headerHeight + ((numTracksToShow - 1) * (clipHeight + clipSpacing)) + clipHeight;

    return (
      <div 
        className="mb-1 relative select-none"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Tight Group Container - positioned and sized like collapsed state */}
        <div
          className={`absolute top-0 transition-all duration-200 select-none ${
            isBeingDragged ? "opacity-80" : ""
          } ${isSnappingToThis ? "ring-2 ring-purple-400" : ""} ${
            selected ? "ring-2 ring-[#E961FF] ring-opacity-50" : ""
          }`}
          style={{
            left: `${timeToPixel(groupStartTime)}px`,
            width: `${groupWidth}px`,
            height: `${totalHeight}px`,
            zIndex: selected ? 15 : 10,
            transform: `scaleX(${zoomLevel})`,
          }}
          data-group-id={group.id}
        >
          {/* Group Header */}
          <div 
            className={`h-[${headerHeight}px] relative transition-all duration-200 ${
              selected ? 'bg-[#2b2b2b]' : 'bg-[#1d1d1d]'
            } rounded-lg overflow-hidden mb-1`}
          >
            {/* Main clickable area for group selection and dragging */}
            <div 
              className={`absolute inset-0 hover:bg-[#2b2b2b] transition-colors ${
                isBeingDragged ? 'cursor-grabbing' : selected ? 'cursor-grab' : 'cursor-pointer'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 Expanded group header clicked - selecting group:', group.id);
                onGroupClick(group.id, e);
              }}
              onMouseDown={(e) => {
                // Only start drag if group is already selected
                if (selected) {
                  console.log('🖱️ Starting drag for selected expanded group:', group.id);
                  e.preventDefault();
                  e.stopPropagation();
                  onGroupMouseDown(group.id, e, "move");
                } else {
                  // If not selected, just select it (click handler will take care of this)
                  console.log('👆 Expanded group not selected, will select on click');
                }
              }}
              title={selected ? "Drag to move group" : "Click to select entire group"}
            />
            
            <div className="flex items-center gap-2 px-2 py-1 h-full relative z-10">
              {/* Chevron Icon - Down for expanded state */}
              <button
                className="w-4 h-4 flex items-center justify-center shrink-0 hover:bg-white/10 rounded relative z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapseGroup(group.id);
                }}
                title="Collapse group"
              >
                <svg className="w-3 h-3 text-[#FAFAFA]" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              {/* Group Icon */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0 pointer-events-none">
                <svg className="w-3 h-3 text-[#BBBBBB]" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 4h10M3 8h10M3 12h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              
              {/* Group Name */}
              <div className="flex-1 min-w-0 pointer-events-none">
                <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
                  {group.name}
                </p>
              </div>
            </div>
            
            {/* Border overlay */}
            <div className="absolute inset-0 border border-[rgba(250,250,250,0.15)] rounded-lg pointer-events-none" />
          </div>

          {/* Track Lanes - visual guides for arranging clips */}
          {(() => {
            // Calculate which track indices are actually being used
            const usedTrackIndices = new Set(
              clips.map(clip => clip.groupTrackIndex ?? clips.indexOf(clip))
            );
            const maxTrackIndex = Math.max(...Array.from(usedTrackIndices), 0);
            
            // Show lanes for used tracks plus one extra for dropping
            const trackLanesToShow = Array.from({ length: maxTrackIndex + 2 }, (_, i) => i);
            
            return trackLanesToShow.map((trackIndex) => (
              <div
                key={`track-lane-${trackIndex}`}
                className="absolute border border-[rgba(250,250,250,0.05)] hover:border-[rgba(250,250,250,0.1)] transition-colors rounded"
                style={{
                  top: `${headerHeight + (trackIndex * (clipHeight + clipSpacing))}px`,
                  left: '0px',
                  right: '0px',
                  height: `${clipHeight}px`,
                  zIndex: 1,
                }}
                data-track-index={trackIndex}
              />
            ));
          })()}

          {/* Group Clips - positioned in their assigned tracks */}
          {clips.map((clip) => {
            // Use groupTrackIndex if available, otherwise assign based on order
            const trackIndex = clip.groupTrackIndex ?? clips.indexOf(clip);
            const clipTop = headerHeight + (trackIndex * (clipHeight + clipSpacing));
            // Position clips relative to group start time for tight hugging
            const relativeLeft = timeToPixel(clip.startTime - groupStartTime);
            
            return (
              <div
                key={clip.id}
                className="absolute"
                style={{
                  top: `${clipTop}px`,
                  left: `${relativeLeft}px`,
                  width: `${timeToPixel(clip.duration)}px`,
                  height: `${clipHeight}px`,
                  zIndex: clip.selected ? 15 : 10,
                  transform: `scaleX(${zoomLevel})`,
                }}
              >
                <div 
                  className="relative w-full h-full"
                  title="Click to select this clip • Click group header to select entire group"
                >
                  <TimelineClipComponent
                    id={clip.id}
                    fileName={String(clip.trackName || clip.name)}
                    duration={clip.duration}
                    startTime={clip.startTime}
                    width={timeToPixel(clip.duration)}
                    selected={Boolean(clip.selected)}
                    waveformData={clip.waveformData}
                    waveformColor={clip.waveformColor}
                    onClipSelect={(clipId: string, event: React.MouseEvent) => onClipClick(clipId, event)}
                    onRangeSelect={onRangeSelect}
                    onClipSplit={(clipId: string, splitPoint: number) => {
                      // Handle split for grouped clips - convert split point to range
                      const splitDuration = 0.1; // Small range around split point
                      const startOffset = Math.max(0, splitPoint - clip.startTime - splitDuration / 2);
                      const endOffset = Math.min(clip.duration, splitPoint - clip.startTime + splitDuration / 2);
                      console.log(`✂️ Split grouped clip ${clipId} at ${splitPoint.toFixed(2)}s (range: ${startOffset.toFixed(2)}-${endOffset.toFixed(2)}s)`);
                      onRangeSplit(clipId, startOffset, endOffset);
                    }}
                    onClipDelete={(clipId: string) => {
                      // Handle delete for grouped clips - delete entire clip
                      console.log(`🗑️ Delete grouped clip ${clipId}`);
                      onRangeDelete(clipId, 0, clip.duration);
                    }}
                    onClipMouseDown={(e: React.MouseEvent) => onClipMouseDown(clip.id, e, "move")}
                  />
                  
                  {/* Trim handles for clips in expanded groups */}
                  {clip.selected && !dragState.isDragging && (
                    <>
                      {/* Left trim handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-30 pointer-events-auto bg-[#E961FF] opacity-0 hover:opacity-75 transition-opacity border-r border-white/20"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onClipMouseDown(clip.id, e, "trim-start");
                        }}
                        title="Drag to trim from start"
                      />
                      {/* Right trim handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-30 pointer-events-auto bg-[#E961FF] opacity-0 hover:opacity-75 transition-opacity border-l border-white/20"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onClipMouseDown(clip.id, e, "trim-end");
                        }}
                        title="Drag to trim from end"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Group trim handles for expanded state */}
          {selected && (
            <>
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity z-20"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onGroupMouseDown(group.id, e, "trim-start");
                }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity z-20"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onGroupMouseDown(group.id, e, "trim-end");
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  }
} 