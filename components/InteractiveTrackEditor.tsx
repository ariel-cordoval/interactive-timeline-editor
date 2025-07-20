import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
// import Track from "../imports/Track";
// import TrackSelected from "../imports/Track-2-4144";
import GroupButton from "../imports/Split-3-4833";
import TimelineClip from "./TimelineClip";
// AudioManager removed - integrated functionality directly into timeline

// Enhanced timeline state types
interface TimelineClip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: "audio" | "video";
  name: string;
  color: string;
  selected: boolean;
  originalWidth?: number;
  trackName?: string;
  groupId?: string; // Add group ID for track grouping
  groupTrackIndex?: number; // Position within the group (0, 1, 2, etc.)
  waveformData: Float32Array;
  waveformColor: string;
  sourceStartOffset: number; // Where in the original audio file this clip starts (in seconds)
}

interface TimelineGroup {
  id: string;
  name: string;
  clipIds: string[];
  color: string;
  collapsed: boolean;
  trackId: string; // Groups now belong to a specific track like clips
}

interface AudioTrackSegment {
  clipId: string;
  startTime: number;
  duration: number;
  audioData: Float32Array;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: "audio" | "video";
  clips: TimelineClip[];
  height: number;
}

interface TimelineState {
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  tracks: TimelineTrack[];
  groups: TimelineGroup[]; // Add groups to timeline state
  isPlaying: boolean;
  totalDuration: number;
}

interface InteractiveTrackEditorProps {
  onTimelineChange?: (state: TimelineState) => void;
}

// Enhanced drag state for vertical movement
interface DragState {
  isDragging: boolean;
  dragType:
    | "move"
    | "trim-start"
    | "trim-end"
    | "playhead"
    | null;
  clipId: string | null;
  selectedClipIds: string[];
  startX: number;
  startY: number;
  startTime: number;
  originalClips: TimelineClip[];
  targetTrackId: string | null;
  trackOffsets: Map<string, number>; // Track relative positions of clips
  isValidDrop: boolean;
  collisionDetected: boolean;
  dragStarted: boolean;
  showNewTrackIndicator: boolean; // For visual feedback when dragging below tracks
}

// Snap state interface
interface SnapState {
  isSnapping: boolean;
  snapPosition: number | null;
  snapType: "start" | "end" | null;
  targetClipId: string | null;
}

// Group Track Row Component - Handles both collapsed and expanded states
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

function GroupTrackRow({
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
      if (!clips.length) return [];
      
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
                  <TimelineClip
                    id={clip.id}
                    fileName={String(clip.trackName || clip.name)}
                    duration={clip.duration}
                    startTime={clip.startTime}
                    width={timeToPixel(clip.duration)}
                    selected={Boolean(clip.selected)}
                    waveformData={clip.waveformData}
                    waveformColor={clip.waveformColor}
                    onClipSelect={(clipId, event) => onClipClick(clipId, event)}
                    onRangeSelect={onRangeSelect}
                    onClipSplit={(clipId, splitPoint) => {
                      // Handle split for grouped clips - convert split point to range
                      const splitDuration = 0.1; // Small range around split point
                      const startOffset = Math.max(0, splitPoint - clip.startTime - splitDuration / 2);
                      const endOffset = Math.min(clip.duration, splitPoint - clip.startTime + splitDuration / 2);
                      console.log(`✂️ Split grouped clip ${clipId} at ${splitPoint.toFixed(2)}s (range: ${startOffset.toFixed(2)}-${endOffset.toFixed(2)}s)`);
                      onRangeSplit(clipId, startOffset, endOffset);
                    }}
                    onClipDelete={(clipId) => {
                      // Handle delete for grouped clips - delete entire clip
                      console.log(`🗑️ Delete grouped clip ${clipId}`);
                      onRangeDelete(clipId, 0, clip.duration);
                    }}
                    onClipMouseDown={(e) => onClipMouseDown(clip.id, e, "move")}
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



// Custom Track Component with interactivity
interface InteractiveTrackProps {
  clip: TimelineClip;
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

function InteractiveTrack({
  clip,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  isDragging,
  zoomLevel,
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

  // Handle clip drag from our TimelineClip component
  // const handleClipDrag = useCallback((clipId: string, newPosition: number) => {
  //   // This is no longer needed - TimelineClip will use onClipMouseDown instead
  //   console.log('Drag handling delegated to main timeline system');
  // }, []);

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
        transform: `scaleX(${zoomLevel})`,
      }}
      data-clip-id={clip.id}
    >
      {/* Use our new TimelineClip component */}
             <TimelineClip
         id={clip.id}
         fileName={String(clip.trackName || clip.name)}
         duration={clip.duration}
         startTime={clip.startTime}
         width={timeToPixel(clip.duration)}
         selected={Boolean(clip.selected)}
         waveformData={clip.waveformData}
         waveformColor={clip.waveformColor}
         onClipSelect={handleClipSelect}
         onRangeSelect={handleRangeSelect}
         onClipSplit={handleClipSplit}
         onClipDelete={handleClipDelete}
         onClipMouseDown={(e) => onClipMouseDown(clip.id, e, "move")}
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
            {/* Left trim handle - covers full height */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 pointer-events-auto bg-[#E961FF] opacity-0 hover:opacity-75 transition-opacity border-r border-white/20"
              onMouseDown={(e) => {
                e.stopPropagation();
                onClipMouseDown(clip.id, e, "trim-start");
              }}
              title="Drag to trim from start"
            />
            {/* Right trim handle - covers full height */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 pointer-events-auto bg-[#E961FF] opacity-0 hover:opacity-75 transition-opacity border-l border-white/20"
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
}

// Enhanced Track Row Component with drop zone
interface TrackRowProps {
  track: TimelineTrack;
  clips: TimelineClip[];
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
  rangeSelection: { clipId: string; startOffset: number; endOffset: number; } | null;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onGroupClick: (groupId: string, event: React.MouseEvent) => void;
  onGroupMouseDown: (groupId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  onExpandGroup: (groupId: string) => void;
  onCollapseGroup: (groupId: string) => void;
}

function TrackRow({
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

// Snap Indicator Component
interface SnapIndicatorProps {
  timeToPixel: (time: number) => number;
  snapState: SnapState;
}

function SnapIndicator({
  timeToPixel,
  snapState,
}: SnapIndicatorProps) {
  if (!snapState.isSnapping || snapState.snapPosition === null)
    return null;

  return (
    <div
      className="absolute top-[78px] bottom-0 w-0.5 bg-purple-400 z-30 transition-all duration-150"
      style={{
        left: `${40 + timeToPixel(snapState.snapPosition)}px`,
      }}
    >
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400 rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full" />
    </div>
  );
}

// Timeline Ruler Component
function TimelineRuler({
  timeToPixel,
  totalDuration,
  zoomLevel,
}: {
  timeToPixel: (time: number) => number;
  totalDuration: number;
  zoomLevel: number;
}) {
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

// Enhanced Controls Component with Group Button
interface InteractiveControlsProps {
  onSplit: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onPlayPause: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSlider: (value: number) => void;
  playheadPosition: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedClips: string[];
  zoomLevel: number;
  hasGroupedSelection: boolean;
  timelineState: TimelineState;
  rangeSelection: { clipId: string; startOffset: number; endOffset: number; } | null;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onClearRangeSelection: () => void;
}

function InteractiveControls({
  onSplit,
  onDelete,
  onGroup,
  onUngroup,
  onPlayPause,
  onZoomIn,
  onZoomOut,
  onZoomSlider,
  playheadPosition,
  totalDuration,
  isPlaying,
  selectedClips,
  zoomLevel,
  hasGroupedSelection,
  timelineState: _timelineState,
  rangeSelection,
  onRangeSplit,
  onRangeDelete,
  onClearRangeSelection,
}: InteractiveControlsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle split - use range split if available
  const handleSplitClick = () => {
    if (rangeSelection) {
      console.log(`✂️ Range split: ${rangeSelection.clipId} from ${rangeSelection.startOffset.toFixed(2)}s to ${rangeSelection.endOffset.toFixed(2)}s`);
      onRangeSplit(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
      onClearRangeSelection(); // Clear the range selection after split
    } else {
      onSplit();
    }
  };

  // Handle delete - use range delete if available
  const handleDeleteClick = () => {
    if (rangeSelection) {
      console.log(`🗑️ Range delete: ${rangeSelection.clipId} from ${rangeSelection.startOffset.toFixed(2)}s to ${rangeSelection.endOffset.toFixed(2)}s`);
      onRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
      onClearRangeSelection(); // Clear the range selection after delete
    } else {
      onDelete();
    }
  };

  return (
    <div className="relative h-[52px] bg-[#0d0d0d] border-b border-[#2b2b2b]">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-start px-4 py-2 relative size-full">
          {/* Actions */}
          <div className="basis-0 box-border content-stretch flex flex-row gap-2 grow items-center justify-start min-h-px min-w-px px-0 py-0.5 relative shrink-0">
            

            {/* Split Button */}
            <button
              className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer"
              onClick={handleSplitClick}
              title={
                rangeSelection
                  ? `Split range selection (${(rangeSelection.endOffset - rangeSelection.startOffset).toFixed(1)}s)`
                  : selectedClips.length > 0
                  ? "Split selected clips at playhead"
                  : "Split all clips at playhead"
              }
            >
              <div className="relative shrink-0 size-4">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M14.4 14H12.8C11.9163 14 11.2 13.2837 11.2 12.4V3.6C11.2 2.71634 11.9163 2 12.8 2H14.4M1.6 2H3.2C4.08366 2 4.8 2.71634 4.8 3.6V12.4C4.8 13.2837 4.08366 14 3.2 14H1.6M8 3.42324V4.87441M8 7.27441V8.72559M8 11.1256V12.5768"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </button>

            {/* Group Button - Only show when multiple clips selected */}
            {selectedClips.length > 1 &&
              !hasGroupedSelection && (
                <button
                  className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer"
                  onClick={onGroup}
                  title="Group selected clips"
                >
                  <GroupButton />
                </button>
              )}

            {/* Ungroup Button - Only show when grouped clips selected */}
            {hasGroupedSelection && (
              <button
                className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer bg-[rgba(120,72,255,0.49)] bg-opacity-20"
                onClick={onUngroup}
                title="Ungroup selected clips"
              >
                <GroupButton />
              </button>
            )}

            {/* Collapse/Expand Button - Only show when grouped clips selected */}


            {/* Delete Button */}
            <button
              className={`box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 ${
                selectedClips.length > 0 || rangeSelection
                  ? "hover:bg-red-600 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleDeleteClick}
              disabled={selectedClips.length === 0 && !rangeSelection}
              title={
                rangeSelection
                  ? `Delete range selection (${(rangeSelection.endOffset - rangeSelection.startOffset).toFixed(1)}s)`
                  : "Delete selected clips"
              }
            >
              <div className="relative shrink-0 size-4">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M6 2H10M2 4H14M12.6667 4L12.1991 11.0129C12.129 12.065 12.0939 12.5911 11.8667 12.99C11.6666 13.3412 11.3648 13.6235 11.0011 13.7998C10.588 14 10.0607 14 9.00623 14H6.99377C5.93927 14 5.41202 14 4.99889 13.7998C4.63517 13.6235 4.33339 13.3412 4.13332 12.99C3.90607 12.5911 3.871 12.065 3.80086 11.0129L3.33333 4"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Player Controls */}
          <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
            {/* Play/Pause Button */}
            <button
              className="relative shrink-0 size-8 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={onPlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 32 32"
              >
                <rect
                  fill="#2B2B2B"
                  height="32"
                  rx="16"
                  width="32"
                />
                {isPlaying ? (
                  <g>
                    <rect
                      x="11"
                      y="9"
                      width="3"
                      height="14"
                      fill="#FAFAFA"
                    />
                    <rect
                      x="18"
                      y="9"
                      width="3"
                      height="14"
                      fill="#FAFAFA"
                    />
                  </g>
                ) : (
                  <path
                    d="M21.625 14.0514C23.125 14.9175 23.125 17.0825 21.625 17.9486L14.875 21.8457C13.375 22.7117 11.5 21.6292 11.5 19.8971L11.5 12.1029C11.5 10.3708 13.375 9.2883 14.875 10.1543L21.625 14.0514Z"
                    fill="#FAFAFA"
                  />
                )}
              </svg>
            </button>

            {/* Time Display */}
            <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center px-4 py-2 relative rounded-lg shrink-0 w-[90px]">
              <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-left text-neutral-50 text-nowrap tracking-[0.2px]">
                <p className="leading-[20px] text-[12px] whitespace-pre">
                  <span>{formatTime(playheadPosition)}</span>
                  <span className="text-[#888888]"> / </span>
                  <span className="text-[#888888]">
                    {formatTime(totalDuration)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
            <div className="flex flex-row items-center justify-end relative size-full">
              <div className="box-border content-stretch flex flex-row gap-2 items-center justify-end pl-4 pr-0 py-0.5 relative w-full">
                <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-0 relative shrink-0">
                  {/* Zoom Out Button */}
                  <button
                    className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 hover:bg-[#333333] transition-colors duration-200"
                    onClick={onZoomOut}
                    title="Zoom out"
                  >
                    <div className="relative shrink-0 size-4">
                      <svg
                        className="block size-full"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                          stroke="#FAFAFA"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Zoom Slider */}
                  <div className="h-4 relative shrink-0 w-[100px]">
                    <div className="absolute h-1 left-0 right-0 top-1/2 translate-y-[-50%]">
                      <div className="absolute bg-[#444444] h-1 left-0 right-0 rounded-[100px] top-1/2 translate-y-[-50%]" />
                      <div
                        className="absolute bg-neutral-50 h-1 left-0 rounded-[100px] top-0"
                        style={{
                          width: `${(zoomLevel - 0.5) * 100}px`,
                        }}
                      />
                    </div>
                    <div
                      className="absolute flex items-center justify-center size-4 top-0 cursor-pointer"
                      style={{
                        left: `${(zoomLevel - 0.5) * 84}px`,
                      }}
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startZoom = zoomLevel;

                        const handleMouseMove = (
                          e: MouseEvent,
                        ) => {
                          const deltaX = e.clientX - startX;
                          const deltaZoom = deltaX / 84;
                          const newZoom = Math.max(
                            0.5,
                            Math.min(
                              2.5,
                              startZoom + deltaZoom,
                            ),
                          );
                          onZoomSlider(newZoom);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                        };

                        document.addEventListener(
                          "mousemove",
                          handleMouseMove,
                        );
                        document.addEventListener(
                          "mouseup",
                          handleMouseUp,
                        );
                      }}
                    >
                      <div className="bg-neutral-50 rounded-[49px] size-4" />
                    </div>
                  </div>

                  {/* Zoom In Button */}
                  <button
                    className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 hover:bg-[#333333] transition-colors duration-200"
                    onClick={onZoomIn}
                    title="Zoom in"
                  >
                    <div className="relative shrink-0 size-4">
                      <svg
                        className="block size-full"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M8 5.33333V10.6667M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                          stroke="#FAFAFA"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveTrackEditor({
  onTimelineChange,
}: InteractiveTrackEditorProps) {
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  
  // Function to load default audio files (Roni.wav and Ingrid.wav)
  const loadDefaultAudioFiles = useCallback(async () => {
    const defaultFiles = [
      { path: './Roni.wav', trackId: 'track-1', color: '#E961FF' },
      { path: './Ingrid.wav', trackId: 'track-2', color: '#4CAF50' }
    ];

    const loadedClips: TimelineClip[] = [];
    const loadedAudioTracks: any[] = [];

    for (const fileInfo of defaultFiles) {
      try {
        console.log(`🎵 Loading default audio file: ${fileInfo.path}...`);
        
        // Fetch the audio file
        const response = await fetch(fileInfo.path);
        if (!response.ok) {
          console.warn(`⚠️ Could not load ${fileInfo.path}: ${response.status}`);
          continue;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Process with Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`✅ WAV decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
        
        // Generate waveform data
        const channelData = audioBuffer.getChannelData(0);
        const duration = audioBuffer.duration;
        const targetSamples = Math.min(1000, Math.max(500, Math.floor(duration * 20)));
        const blockSize = Math.floor(channelData.length / targetSamples);
        const waveformData = new Float32Array(targetSamples);
        
        // Calculate RMS values for each block
        for (let i = 0; i < targetSamples; i++) {
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channelData.length);
          
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += channelData[j] * channelData[j];
          }
          
          waveformData[i] = Math.sqrt(sum / (end - start));
        }
        
        // Normalize waveform data
        const maxValue = Math.max(...Array.from(waveformData));
        if (maxValue > 0) {
          for (let i = 0; i < waveformData.length; i++) {
            waveformData[i] = waveformData[i] / maxValue;
          }
        }
        
        // Create timeline clip
        const fileName = fileInfo.path.split('/').pop()?.replace('.wav', '') || 'Unknown';
        const newClip: TimelineClip = {
          id: `default-clip-${fileName}`,
          trackId: fileInfo.trackId,
          startTime: 0,
          endTime: audioBuffer.duration,
          duration: audioBuffer.duration,
          type: "audio" as const,
          name: fileName,
          color: fileInfo.color,
          selected: false,
          originalWidth: Math.floor(audioBuffer.duration * 20),
          trackName: fileName,
          waveformData: waveformData,
          waveformColor: fileInfo.color,
          sourceStartOffset: 0,
        };
        
        loadedClips.push(newClip);
        
        // Store audio data for playback (matching the format expected by handlePlayPause)
        loadedAudioTracks.push({
          id: `default-audio-${fileName}`,
          name: fileName,
          file: { name: fileInfo.path },
          audioBuffer: audioBuffer,
          audioContext: audioContext,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channelData: audioBuffer.getChannelData(0), // Store channel data for playback
          segments: [{
            clipId: newClip.id,
            startTime: 0,
            endTime: audioBuffer.duration,
            sourceOffset: 0
          }]
        });
        
        console.log(`✅ Successfully loaded ${fileName} (${duration.toFixed(2)}s)`);
        
      } catch (error) {
        console.error(`❌ Error loading ${fileInfo.path}:`, error);
      }
    }

    return { clips: loadedClips, audioTracks: loadedAudioTracks };
  }, []);

  // Initialize with empty tracks - will be populated by loadDefaultAudioFiles
  const initialTracks: TimelineTrack[] = [
    {
      id: "track-1",
      name: "T1",
      type: "audio" as const,
      clips: [],
      height: 65,
    },
    {
      id: "track-2", 
      name: "T2",
      type: "audio" as const,
      clips: [],
      height: 65,
    },
  ];

  // Calculate initial dynamic duration
  const calculateInitialDuration = (tracks: TimelineTrack[]) => {
    let maxEndTime = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxEndTime = Math.max(maxEndTime, clip.endTime);
      });
    });
    const padding = Math.max(30, maxEndTime * 0.2);
    return Math.max(60, maxEndTime + padding);
  };

  const [timelineState, setTimelineState] =
    useState<TimelineState>({
      playheadPosition: 5,
      zoomLevel: 1,
      selectedClips: [], // Start with no selection
      tracks: initialTracks,
      groups: [], // Initialize with no groups
      isPlaying: false,
      totalDuration: calculateInitialDuration(initialTracks),
    });

  const containerRef = useRef<HTMLDivElement>(null);
  const trackAreaRef = useRef<HTMLDivElement>(null);
  
  // Range selection state for split/delete operations
  const [rangeSelection, setRangeSelection] = useState<{
    clipId: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    clipId: null,
    selectedClipIds: [],
    startX: 0,
    startY: 0,
    startTime: 0,
    originalClips: [],
    targetTrackId: null,
    trackOffsets: new Map(),
    isValidDrop: false,
    collisionDetected: false,
    dragStarted: false,
    showNewTrackIndicator: false,
  });

  const [snapState, setSnapState] = useState<SnapState>({
    isSnapping: false,
    snapPosition: null,
    snapType: null,
    targetClipId: null,
  });

  // Track mouse down state for click vs drag detection
  const [mouseDownState, setMouseDownState] = useState<{
    isMouseDown: boolean;
    startX: number;
    startY: number;
    startTime: number;
    clipId: string | null;
    dragType: "move" | "trim-start" | "trim-end" | null;
  }>({
    isMouseDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    clipId: null,
    dragType: null,
  });

  // Notify parent of timeline changes
  useEffect(() => {
    if (onTimelineChange) {
      onTimelineChange(timelineState);
    }
  }, [timelineState, onTimelineChange]);

  // Load default audio files on component mount
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { clips, audioTracks } = await loadDefaultAudioFiles();
        
        if (clips.length > 0) {
          console.log(`🎵 Loaded ${clips.length} default audio files`);
          
          // Create a default group ID
          const defaultGroupId = 'default-group-1';
          
          // Update clips with group information
          const groupedClips = clips.map((clip, index) => ({
            ...clip,
            groupId: defaultGroupId,
            groupTrackIndex: index, // 0 for first clip, 1 for second, etc.
          }));
          
          // Update timeline state with loaded clips and create default group
          setTimelineState((prev) => {
            const updatedTracks = prev.tracks.map((track) => {
              const trackClips = groupedClips.filter(clip => clip.trackId === track.id);
              return {
                ...track,
                clips: trackClips,
              };
            });

            // Create default group (collapsed by default)
            const defaultGroup = {
              id: defaultGroupId,
              name: 'Audio Group',
              clipIds: groupedClips.map(clip => clip.id),
              color: '#E961FF',
              collapsed: true, // Start collapsed to show combined waveform
              trackId: 'track-1', // Place group on first track
            };

            // Recalculate timeline duration manually
            let maxEndTime = 0;
            updatedTracks.forEach(track => {
              track.clips.forEach(clip => {
                maxEndTime = Math.max(maxEndTime, clip.endTime);
              });
            });
            const padding = Math.max(30, maxEndTime * 0.2);
            const newDuration = Math.max(60, maxEndTime + padding);

            console.log(`✅ Created default group with ${groupedClips.length} clips (collapsed)`);

            return {
              ...prev,
              tracks: updatedTracks,
              groups: [defaultGroup], // Add the default group
              totalDuration: newDuration,
            };
          });
          
          // Update audio tracks
          setAudioTracks(audioTracks);
          console.log(`✅ Audio tracks updated:`, audioTracks.map(t => ({ name: t.name, duration: t.duration, hasChannelData: !!t.channelData })));
        }
      } catch (error) {
        console.error('❌ Error loading default audio files:', error);
      }
    };

    loadDefaults();
  }, [loadDefaultAudioFiles]);

  // Convert time to pixel position
  const timeToPixel = useCallback(
    (time: number) => {
      const timelineWidth = 1262;
      const visibleDuration = timelineState.totalDuration / timelineState.zoomLevel; // Use dynamic duration
      return (time / visibleDuration) * timelineWidth;
    },
    [timelineState.zoomLevel, timelineState.totalDuration],
  );

  // Convert pixel position to time
  const pixelToTime = useCallback(
    (pixel: number) => {
      const timelineWidth = 1262;
      const visibleDuration = timelineState.totalDuration / timelineState.zoomLevel; // Use dynamic duration
      return (pixel / timelineWidth) * visibleDuration;
    },
    [timelineState.zoomLevel, timelineState.totalDuration],
  );

  // Get track at Y position - accounts for expanded groups at top
  const getTrackAtY = useCallback(
    (y: number) => {
      if (!trackAreaRef.current) return null;

      const rect = trackAreaRef.current.getBoundingClientRect();
      const relativeY = y - rect.top;
      
      // Account for expanded groups at the top
      const expandedGroups = timelineState.groups.filter(g => !g.collapsed);
      let expandedGroupsHeight = 0;
      
      expandedGroups.forEach(group => {
        const groupClips = timelineState.tracks
          .flatMap(t => t.clips)
          .filter(clip => clip.groupId === group.id);
        
        if (groupClips.length > 0) {
          const clipHeight = 58;
          const headerHeight = 28;
          const clipSpacing = 4;
          const usedTrackIndices = new Set(
            groupClips.map(clip => clip.groupTrackIndex ?? groupClips.indexOf(clip))
          );
          const maxTrackIndex = Math.max(...Array.from(usedTrackIndices), 0);
          const numTracksToShow = maxTrackIndex + 2;
          const totalHeight = headerHeight + ((numTracksToShow - 1) * (clipHeight + clipSpacing)) + clipHeight + 4; // +4 for margin
          expandedGroupsHeight += totalHeight;
        }
      });
      
      // If clicking in expanded group area, return null (can't drop on expanded groups)
      if (relativeY < expandedGroupsHeight) {
        console.log(`📍 Click in expanded group area: relativeY=${relativeY}, expandedGroupsHeight=${expandedGroupsHeight}`);
        return null;
      }
      
      // Adjust for expanded groups above regular tracks
      const adjustedY = relativeY - expandedGroupsHeight;
      const trackIndex = Math.floor(adjustedY / 66); // 65px height + 1px margin

      console.log(`📍 getTrackAtY: y=${y}, relativeY=${relativeY}, adjustedY=${adjustedY}, trackIndex=${trackIndex}`);

      if (
        trackIndex >= 0 &&
        trackIndex < timelineState.tracks.length
      ) {
        const targetTrack = timelineState.tracks[trackIndex];
        console.log(`   ✅ Target track: index=${trackIndex}, id=${targetTrack.id}`);
        return targetTrack;
      }
      console.log(`   ❌ No valid track found`);
      return null;
    },
    [timelineState.tracks, timelineState.groups],
  );

  // Get track index by ID
  const getTrackIndex = useCallback(
    (trackId: string) => {
      return timelineState.tracks.findIndex(
        (track) => track.id === trackId,
      );
    },
    [timelineState.tracks],
  );

  // Get track by index
  const getTrackByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < timelineState.tracks.length) {
        return timelineState.tracks[index];
      }
      return null;
    },
    [timelineState.tracks],
  );

  // Get group track index at Y position within a group
  const getGroupTrackIndexAtY = useCallback(
    (groupId: string, y: number) => {
      if (!trackAreaRef.current) return null;

      // Find the group element
      const groupElement = trackAreaRef.current.querySelector(`[data-group-id="${groupId}"]`);
      if (!groupElement) return null;
      
      const groupRect = groupElement.getBoundingClientRect();
      const groupRelativeY = y - groupRect.top;
      
      // Calculate track index within the group (match expanded group constants)
      const headerHeight = 28; // Group header height
      const clipHeight = 58;
      const clipSpacing = 4;
      const trackHeight = clipHeight + clipSpacing;
      
      if (groupRelativeY < headerHeight) return null; // In header area
      
      const trackIndex = Math.floor((groupRelativeY - headerHeight) / trackHeight);
      console.log(`📍 Group track index: groupRelativeY=${groupRelativeY}, trackIndex=${trackIndex}`);
      
      return trackIndex >= 0 ? trackIndex : null;
    },
    [],
  );

  // Check for collision with existing clips
  const checkCollision = useCallback(
    (
      clipIds: string[],
      trackId: string,
      startTime: number,
      endTime: number,
    ) => {
      const track = timelineState.tracks.find(
        (t) => t.id === trackId,
      );
      if (!track) return false;

      return track.clips.some(
        (clip) =>
          !clipIds.includes(clip.id) &&
          !(
            endTime <= clip.startTime ||
            startTime >= clip.endTime
          ),
      );
    },
    [timelineState.tracks],
  );

  // Check for collisions across multiple tracks for multi-clip drag
  const checkMultiTrackCollisions = useCallback(
    (
      clipPositions: Array<{
        clipId: string;
        trackId: string;
        startTime: number;
        endTime: number;
      }>,
    ) => {
      return clipPositions.some((pos) =>
        checkCollision(
          [pos.clipId],
          pos.trackId,
          pos.startTime,
          pos.endTime,
        ),
      );
    },
    [checkCollision],
  );

  // Find an available track for a clip to avoid collision (prefers tracks below)
  const findAvailableTrack = useCallback(
    (
      clipId: string,
      startTime: number,
      endTime: number,
      excludeTrackIds: string[] = [],
      preferBelow: boolean = true
    ) => {
      const excludedTracks = new Set(excludeTrackIds);
      
      if (preferBelow) {
        // First try tracks below the excluded track (natural flow)
        const currentTrackIndex = excludeTrackIds.length > 0 
          ? getTrackIndex(excludeTrackIds[0]) 
          : -1;
          
        // Check tracks below first
        for (let i = currentTrackIndex + 1; i < timelineState.tracks.length; i++) {
          const track = timelineState.tracks[i];
          if (!excludedTracks.has(track.id) && !checkCollision([clipId], track.id, startTime, endTime)) {
            return track.id;
          }
        }
        
        // Then check tracks above
        for (let i = 0; i < currentTrackIndex; i++) {
          const track = timelineState.tracks[i];
          if (!excludedTracks.has(track.id) && !checkCollision([clipId], track.id, startTime, endTime)) {
            return track.id;
          }
        }
      } else {
        // Check all tracks in order
        for (const track of timelineState.tracks) {
          if (!excludedTracks.has(track.id) && !checkCollision([clipId], track.id, startTime, endTime)) {
            return track.id;
          }
        }
      }
      
      // If no available track found, we'll need to create a new one
      return 'CREATE_NEW_TRACK';
    },
    [timelineState.tracks, checkCollision, getTrackIndex],
  );

  // Create a new track for clips that need it
  const createNewTrack = useCallback(() => {
    const newTrackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTrack: TimelineTrack = {
      id: newTrackId,
      name: `T${timelineState.tracks.length + 1}`,
      type: "audio",
      clips: [],
      height: 120,
    };
    return newTrack;
  }, [timelineState.tracks.length]);

  // Remove empty tracks (except if it's the last track)
  const removeEmptyTracks = useCallback(() => {
    setTimelineState((prev) => {
      const nonEmptyTracks = prev.tracks.filter(track => 
        track.clips.length > 0 || prev.tracks.length === 1 // Keep at least one track
      );
      
      if (nonEmptyTracks.length !== prev.tracks.length) {
        console.log(`🗑️ Removed ${prev.tracks.length - nonEmptyTracks.length} empty tracks`);
        return {
          ...prev,
          tracks: nonEmptyTracks
        };
      }
      
      return prev;
    });
  }, []);

  // Check if dragging below the last track (for new track creation)
  const isAboveNewTrackZone = useCallback((y: number) => {
    const trackAreaRect = trackAreaRef.current?.getBoundingClientRect();
    if (!trackAreaRect) return false;
    
    const relativeY = y - trackAreaRect.top;
    
    // Account for group track rows rendered first
    const groupCount = timelineState.groups.length;
    const groupRowHeight = 66; // Same as track height (65px + 1px margin)
    const totalGroupHeight = groupCount * groupRowHeight;
    
    // Calculate total height including groups and regular tracks
    const tracksHeight = totalGroupHeight + (timelineState.tracks.length * 66); // 65px height + 1px margin
    
    return relativeY > tracksHeight && relativeY < tracksHeight + 40; // 40px zone for new track
  }, [timelineState.tracks.length, timelineState.groups.length]);

  // Handle automatic track switching for non-selected clips during collisions
  const handleAutoTrackSwitch = useCallback(
    (
      clipPositions: Array<{
        clipId: string;
        trackId: string;
        startTime: number;
        endTime: number;
      }>,
      selectedClipIds: string[]
    ) => {
      const updatedPositions = [...clipPositions];
      
      for (let i = 0; i < updatedPositions.length; i++) {
        const pos = updatedPositions[i];
        
        // Skip selected clips - they have priority
        if (selectedClipIds.includes(pos.clipId)) continue;
        
        // Check if this clip is colliding
        if (checkCollision([pos.clipId], pos.trackId, pos.startTime, pos.endTime)) {
          console.log(`🔄 Auto-switching track for non-selected clip ${pos.clipId} due to collision`);
          
          // Find an available track
          const availableTrackId = findAvailableTrack(
            pos.clipId,
            pos.startTime,
            pos.endTime,
            [pos.trackId] // Exclude current track
          );
          
          if (availableTrackId) {
            updatedPositions[i] = {
              ...pos,
              trackId: availableTrackId
            };
            console.log(`   ✅ Moved clip ${pos.clipId} to track ${availableTrackId}`);
          }
        }
      }
      
      return updatedPositions;
    },
    [checkCollision, findAvailableTrack],
  );

  // Find snap points for a given clip and position
  const findSnapPoints = useCallback(
    (
      clipIds: string[],
      dragType: "move" | "trim-start" | "trim-end",
      newStartTime: number,
      newEndTime: number,
    ) => {
      const snapThreshold = pixelToTime(10); // 10px threshold converted to time
      const allClips = timelineState.tracks.flatMap(
        (track) => track.clips,
      );
      const otherClips = allClips.filter(
        (clip) => !clipIds.includes(clip.id),
      );

      const snapPoints: Array<{
        time: number;
        type: "start" | "end";
        targetClipId: string;
      }> = [];

      // Add snap points from other clips
      otherClips.forEach((clip) => {
        snapPoints.push(
          {
            time: clip.startTime,
            type: "start",
            targetClipId: clip.id,
          },
          {
            time: clip.endTime,
            type: "end",
            targetClipId: clip.id,
          },
        );
      });

      // Add playhead snap point
      snapPoints.push({
        time: timelineState.playheadPosition,
        type: "start",
        targetClipId: "playhead",
      });

      // Check for snaps based on drag type
      if (dragType === "move") {
        // Check start time snaps
        for (const snapPoint of snapPoints) {
          const distance = Math.abs(
            newStartTime - snapPoint.time,
          );
          if (distance <= snapThreshold) {
            return {
              snapTime: snapPoint.time,
              snapType: snapPoint.type,
              targetClipId: snapPoint.targetClipId,
              adjustment: snapPoint.time - newStartTime,
            };
          }
        }

        // Check end time snaps
        for (const snapPoint of snapPoints) {
          const distance = Math.abs(
            newEndTime - snapPoint.time,
          );
          if (distance <= snapThreshold) {
            return {
              snapTime: snapPoint.time,
              snapType: snapPoint.type,
              targetClipId: snapPoint.targetClipId,
              adjustment: snapPoint.time - newEndTime,
            };
          }
        }
      } else if (dragType === "trim-start") {
        // Check start time snaps for trimming
        for (const snapPoint of snapPoints) {
          const distance = Math.abs(
            newStartTime - snapPoint.time,
          );
          if (distance <= snapThreshold) {
            return {
              snapTime: snapPoint.time,
              snapType: snapPoint.type,
              targetClipId: snapPoint.targetClipId,
              adjustment: snapPoint.time - newStartTime,
            };
          }
        }
      } else if (dragType === "trim-end") {
        // Check end time snaps for trimming
        for (const snapPoint of snapPoints) {
          const distance = Math.abs(
            newEndTime - snapPoint.time,
          );
          if (distance <= snapThreshold) {
            return {
              snapTime: snapPoint.time,
              snapType: snapPoint.type,
              targetClipId: snapPoint.targetClipId,
              adjustment: snapPoint.time - newEndTime,
            };
          }
        }
      }

      return null;
    },
    [
      timelineState.tracks,
      timelineState.playheadPosition,
      pixelToTime,
    ],
  );

  // Get clips in same group as a given clip
  const getClipsInGroup = useCallback(
    (clipId: string) => {
      const allClips = timelineState.tracks.flatMap(
        (track) => track.clips,
      );
      const clip = allClips.find((c) => c.id === clipId);
      if (!clip || !clip.groupId) return [clipId];

      const group = timelineState.groups.find(
        (g) => g.id === clip.groupId,
      );
      if (!group) return [clipId];

      return group.clipIds;
    },
    [timelineState.tracks, timelineState.groups],
  );

  // Helper function to generate waveform data from audio channel data
  const generateWaveformFromAudio = useCallback((audioData: Float32Array, sampleRate: number): Float32Array => {
    const duration = audioData.length / sampleRate;
    const targetSamples = Math.min(1000, Math.max(500, Math.floor(duration * 20)));
    const blockSize = Math.floor(audioData.length / targetSamples);
    const waveformData = new Float32Array(targetSamples);
    
    // Calculate RMS values for each block
    for (let i = 0; i < targetSamples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, audioData.length);
      
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += audioData[j] * audioData[j];
      }
      
      waveformData[i] = Math.sqrt(sum / (end - start));
    }
    
    // Normalize waveform data
    const maxValue = Math.max(...Array.from(waveformData));
    if (maxValue > 0) {
      for (let i = 0; i < waveformData.length; i++) {
        waveformData[i] = waveformData[i] / maxValue;
      }
    }
    
    return waveformData;
  }, []);

  // Calculate dynamic timeline duration based on content
  const calculateTimelineDuration = useCallback((tracks: TimelineTrack[]): number => {
    let maxEndTime = 0;
    
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxEndTime = Math.max(maxEndTime, clip.endTime);
      });
    });
    
    // Add padding (20% extra or minimum 30 seconds)
    const padding = Math.max(30, maxEndTime * 0.2);
    const dynamicDuration = maxEndTime + padding;
    
    // Ensure minimum duration of 60 seconds for usability
    return Math.max(60, dynamicDuration);
  }, []);

  // Update timeline duration whenever content changes
  // const updateTimelineDuration = useCallback((newTracks: TimelineTrack[]) => {
  //   const newDuration = calculateTimelineDuration(newTracks);
  //   return newDuration;
  // }, [calculateTimelineDuration]);

  // Check if any selected clips are grouped
  const hasGroupedSelection = useCallback(() => {
    const allClips = timelineState.tracks.flatMap(
      (track) => track.clips,
    );
    return timelineState.selectedClips.some((clipId) => {
      const clip = allClips.find((c) => c.id === clipId);
      return (
        clip &&
        clip.groupId &&
        timelineState.groups.some((g) => g.id === clip.groupId)
      );
    });
  }, [
    timelineState.selectedClips,
    timelineState.tracks,
    timelineState.groups,
  ]);

  // Handle timeline ruler click
  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!containerRef.current || dragState.isDragging) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - 40;
      const time = pixelToTime(x);

      setTimelineState((prev) => ({
        ...prev,
        playheadPosition: Math.max(0, Math.min(time, prev.totalDuration)),
      }));
    },
    [pixelToTime, dragState.isDragging],
  );

  // Handle background click to deselect all
  const handleBackgroundClick = useCallback(
    (event: React.MouseEvent) => {
      // Check if we're clicking on an interactive element that should not trigger deselection
      const target = event.target as HTMLElement;
      
      // Check if clicking on a clip or collapsed group
      const clipElement = target.closest('[data-clip-id]');
      const clipId = clipElement?.getAttribute('data-clip-id');
      
      const groupElement = target.closest('[data-group-id]');
      const groupId = groupElement?.getAttribute('data-group-id');
      
      // Don't deselect if clicking on controls or other interactive elements (but allow clip clicks)
      const isNonClipInteractiveElement = target.closest('button') ||           // Buttons
                                          target.closest('input') ||            // Inputs
                                          target.closest('[role="slider"]') ||  // Sliders
                                          target.closest('.cursor-ew-resize') || // Trim handles
                                          target.closest('.cursor-col-resize') || // Playhead
                                          target.closest('[data-no-deselect]'); // Elements marked to not deselect
      
      // Handle deselection logic
      if (!isNonClipInteractiveElement && !dragState.isDragging) {
        if (clipId) {
          // Clicking on a specific clip - check if it's selected and should be deselected
          const isClipSelected = timelineState.selectedClips.includes(clipId);
          
          if (isClipSelected) {
            // Deselect this specific clip and its group members
            const clipsToDeselect = getClipsInGroup(clipId);
            
            setTimelineState((prev) => ({
              ...prev,
              selectedClips: prev.selectedClips.filter(id => !clipsToDeselect.includes(id)),
              tracks: prev.tracks.map((track) => ({
                ...track,
                clips: track.clips.map((clip) => ({
                  ...clip,
                  selected: clip.selected && !clipsToDeselect.includes(clip.id),
                })),
              })),
            }));
            
            // Also clear range selection
            setRangeSelection(null);
            
            console.log(`🔄 Deselected clip ${clipId} and its group members`);
          }
          // If clip is not selected, do nothing (let normal clip selection handle it)
        } else if (groupId) {
          // Clicking on a collapsed group - check if it's selected and should be deselected
          const group = timelineState.groups.find(g => g.id === groupId);
          if (group) {
            const isGroupSelected = group.clipIds.every(id => 
              timelineState.selectedClips.includes(id));
            
            if (isGroupSelected) {
              // Deselect the entire group
              setTimelineState((prev) => ({
                ...prev,
                selectedClips: prev.selectedClips.filter(id => !group.clipIds.includes(id)),
                tracks: prev.tracks.map((track) => ({
                  ...track,
                  clips: track.clips.map((clip) => ({
                    ...clip,
                    selected: clip.selected && !group.clipIds.includes(clip.id),
                  })),
                })),
              }));
              
              // Also clear range selection
              setRangeSelection(null);
              
              console.log(`🔄 Deselected collapsed group ${groupId}`);
            }
          }
          // If group is not selected, do nothing (let normal group selection handle it)
        } else {
          // Clicking on empty timeline area - deselect all
          setTimelineState((prev) => ({
            ...prev,
            selectedClips: [],
            tracks: prev.tracks.map((track) => ({
              ...track,
              clips: track.clips.map((clip) => ({
                ...clip,
                selected: false,
              })),
            })),
          }));
          
          // Also clear range selection
          setRangeSelection(null);
          
          console.log('🔄 Deselected all clips and cleared range selection');
        }
      }
    },
    [dragState.isDragging, timelineState.selectedClips, getClipsInGroup],
  );

  // Handle clip selection with multi-selection support and group auto-selection
  const handleClipClick = useCallback(
    (clipId: string, event: React.MouseEvent) => {
      // Prevent selection during drag operations
      if (dragState.isDragging) return;

      const isMultiSelect =
        event.shiftKey || event.ctrlKey || event.metaKey;

      setTimelineState((prev) => {
        let newSelectedClips: string[];

        // Get clip and check if it's in an expanded group
        const allClips = prev.tracks.flatMap(track => track.clips);
        const clip = allClips.find(c => c.id === clipId);
        const group = clip?.groupId ? prev.groups.find(g => g.id === clip.groupId) : null;
        const isExpandedGroup = group && !group.collapsed;

        // Determine what clips to select
        let clipsToSelect: string[];
        if (isExpandedGroup) {
          // Click on clip in expanded group = select only that clip
          clipsToSelect = [clipId];
          console.log(`🎯 Individual clip selection in expanded group: ${clipId}`);
        } else {
          // Normal behavior: select all clips in group (or just the clip if not grouped)
          clipsToSelect = getClipsInGroup(clipId);
        }

        if (isMultiSelect) {
          // Multi-select: toggle selection of the group
          const allSelected = clipsToSelect.every((id) =>
            prev.selectedClips.includes(id),
          );
          if (allSelected) {
            // Remove all clips in group from selection
            newSelectedClips = prev.selectedClips.filter(
              (id) => !clipsToSelect.includes(id),
            );
          } else {
            // Add all clips in group to selection
            newSelectedClips = [
              ...new Set([
                ...prev.selectedClips,
                ...clipsToSelect,
              ]),
            ];
          }
        } else {
          // Single click behavior: toggle selection if already selected, otherwise select
          const isAlreadySelected = clipsToSelect.every((id) =>
            prev.selectedClips.includes(id),
          );
          
          if (isAlreadySelected && clipsToSelect.length === prev.selectedClips.length) {
            // If clicking on the only selected clip(s), deselect them
            newSelectedClips = [];
            console.log('🔄 Deselected clip(s) by clicking on selected clip');
          } else if (isAlreadySelected) {
            // If clicking on selected clip(s) but there are other selections, just select this group
            newSelectedClips = clipsToSelect;
          } else {
            // Not selected, so select the group
            newSelectedClips = clipsToSelect;
          }
        }

        // Clear range selection when changing clip selection (but preserve it if selecting the same group)
        const currentRangeIsForGroup = rangeSelection && prev.groups.some(g => g.id === rangeSelection.clipId);
        const newSelectionIncludesRangeGroup = currentRangeIsForGroup && 
          prev.groups.find(g => g.id === rangeSelection!.clipId)?.clipIds.every(id => newSelectedClips.includes(id));
        
        if (!newSelectionIncludesRangeGroup && (newSelectedClips.length !== prev.selectedClips.length || 
            !newSelectedClips.every(id => prev.selectedClips.includes(id)))) {
          setRangeSelection(null);
        }

        return {
          ...prev,
          selectedClips: newSelectedClips,
          tracks: prev.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => ({
              ...clip,
              selected: newSelectedClips.includes(clip.id),
            })),
          })),
        };
      });
    },
    [dragState.isDragging, getClipsInGroup],
  );

  // Handle clip mouse down (for drag detection)
  const handleClipMouseDown = useCallback(
    (
      clipId: string,
      event: React.MouseEvent,
      dragType: "move" | "trim-start" | "trim-end",
    ) => {
      // Don't start drag if already dragging
      if (dragState.isDragging) return;

      setMouseDownState({
        isMouseDown: true,
        startX: event.clientX,
        startY: event.clientY,
        startTime: Date.now(),
        clipId,
        dragType,
      });
    },
    [dragState.isDragging],
  );

  // Handle playhead drag
  const handlePlayheadDragStart = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      if (dragState.isDragging) return;

      setDragState({
        isDragging: true,
        dragType: "playhead",
        clipId: null,
        selectedClipIds: [],
        startX: event.clientX,
        startY: event.clientY,
        startTime: timelineState.playheadPosition,
        originalClips: [],
        targetTrackId: null,
        trackOffsets: new Map(),
        isValidDrop: true,
        collisionDetected: false,
        dragStarted: true,
        showNewTrackIndicator: false,
      });
    },
    [timelineState.playheadPosition, dragState.isDragging],
  );

  // Handle split operation
  const handleSplit = useCallback(() => {
    // If we have a range selection, trigger range split
    if (rangeSelection) {
      console.log(`✂️ Using range split for ${rangeSelection.clipId}`);
      // We'll call the range split logic directly from the button/keyboard
      return;
    }

    // Fallback to playhead split if no range selection
    if (timelineState.selectedClips.length === 0) {
      console.log('⚠️ No clips selected for split operation');
      return;
    }

    const splitTime = timelineState.playheadPosition;
    
    // Check if we're splitting collapsed groups
    const selectedGroups = timelineState.groups.filter(group => 
      group.collapsed && group.clipIds.some(clipId => timelineState.selectedClips.includes(clipId))
    );
    
    if (selectedGroups.length > 0) {
      console.log(`✂️ Group split at ${splitTime.toFixed(2)}s - splitting ${selectedGroups.length} collapsed group(s)`);
      
      // Handle group splits
      setTimelineState((prev) => {
        const newGroups = [...prev.groups];
        const updatedTracks = prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.flatMap((clip) => {
            if (!prev.selectedClips.includes(clip.id)) {
              return clip;
            }

            // Find the group this clip belongs to
            const group = prev.groups.find(g => g.id === clip.groupId);
            if (!group || !group.collapsed) {
              // Not in a collapsed group, handle normally
              if (splitTime <= clip.startTime || splitTime >= clip.endTime) {
                return clip;
              }

              const firstPart: TimelineClip = {
                ...clip,
                id: `${clip.id}-first-${Date.now()}`,
                endTime: splitTime,
                duration: splitTime - clip.startTime,
                selected: false,
                waveformData: clip.waveformData,
                waveformColor: clip.waveformColor,
              };

              const secondPart: TimelineClip = {
                ...clip,
                id: `${clip.id}-second-${Date.now()}`,
                startTime: splitTime,
                duration: clip.endTime - splitTime,
                selected: false,
                waveformData: clip.waveformData,
                waveformColor: clip.waveformColor,
              };

              return [firstPart, secondPart];
            }

            // This clip is in a collapsed group - handle group split
            if (splitTime <= clip.startTime || splitTime >= clip.endTime) {
              return clip;
            }

            const timestamp = Date.now() + Math.random() * 1000; // Ensure unique IDs

            const firstPart: TimelineClip = {
              ...clip,
              id: `${clip.id}-first-${timestamp}`,
              endTime: splitTime,
              duration: splitTime - clip.startTime,
              selected: false,
              waveformData: clip.waveformData,
              waveformColor: clip.waveformColor,
              groupId: `${group.id}-first-${timestamp}`, // New group for first part
            };

            const secondPart: TimelineClip = {
              ...clip,
              id: `${clip.id}-second-${timestamp}`,
              startTime: splitTime,
              duration: clip.endTime - splitTime,
              selected: true, // Select the second part
              waveformData: clip.waveformData,
              waveformColor: clip.waveformColor,
              groupId: `${group.id}-second-${timestamp}`, // New group for second part
            };

            // Create new groups for the split parts
            const firstGroupExists = newGroups.some(g => g.id === firstPart.groupId);
            const secondGroupExists = newGroups.some(g => g.id === secondPart.groupId);

            if (!firstGroupExists) {
              newGroups.push({
                id: firstPart.groupId!,
                name: `${group.name} (1)`,
                clipIds: [], // Will be populated after all clips are processed
                collapsed: group.collapsed,
                color: group.color,
                trackId: group.trackId,
              });
            }

            if (!secondGroupExists) {
              newGroups.push({
                id: secondPart.groupId!,
                name: `${group.name} (2)`,
                clipIds: [], // Will be populated after all clips are processed
                collapsed: group.collapsed,
                color: group.color,
                trackId: group.trackId,
              });
            }

            return [firstPart, secondPart];
          }),
        }));

        // Update group clipIds after all clips have been processed
        const allClips = updatedTracks.flatMap(track => track.clips);
        const finalGroups = newGroups.map(group => ({
          ...group,
          clipIds: allClips
            .filter(clip => clip.groupId === group.id)
            .map(clip => clip.id)
        })).filter(group => group.clipIds.length > 0); // Remove empty groups

        // Select clips from the second part of split groups
        const newSelectedClips = allClips
          .filter(clip => clip.selected)
          .map(clip => clip.id);

        // Recalculate timeline duration
        const newDuration = calculateTimelineDuration(updatedTracks);

        console.log(`✅ Group split complete: created ${finalGroups.length - prev.groups.length} new groups`);

        return {
          ...prev,
          tracks: updatedTracks,
          groups: finalGroups,
          selectedClips: newSelectedClips,
          totalDuration: newDuration,
        };
      });
      
      return;
    }
    
    // Regular clip split (not in collapsed groups)
    console.log(`✂️ Regular split at ${splitTime.toFixed(2)}s`);

    setTimelineState((prev) => {
      const updatedTracks = prev.tracks.map((track) => ({
        ...track,
        clips: track.clips.flatMap((clip) => {
          if (
            !prev.selectedClips.includes(clip.id) ||
            splitTime <= clip.startTime ||
            splitTime >= clip.endTime
          ) {
            return clip;
          }

          // Split the clip into two parts
          const firstPart: TimelineClip = {
            ...clip,
            id: `${clip.id}-first-${Date.now()}`,
            endTime: splitTime,
            duration: splitTime - clip.startTime,
            selected: false,
            waveformData: clip.waveformData,
            waveformColor: clip.waveformColor,
          };

          const secondPart: TimelineClip = {
            ...clip,
            id: `${clip.id}-second-${Date.now()}`,
            startTime: splitTime,
            duration: clip.endTime - splitTime,
            selected: true,
            waveformData: clip.waveformData,
            waveformColor: clip.waveformColor,
          };

          return [firstPart, secondPart];
        }),
      }));

      // Recalculate timeline duration
      const newDuration = calculateTimelineDuration(updatedTracks);

      // Select the second parts of split clips
      const newSelectedClips = updatedTracks
        .flatMap(track => track.clips)
        .filter(clip => clip.selected)
        .map(clip => clip.id);

      return {
        ...prev,
        tracks: updatedTracks,
        selectedClips: newSelectedClips,
        totalDuration: newDuration,
      };
    });
  }, [rangeSelection, timelineState.selectedClips, timelineState.playheadPosition, timelineState.groups, calculateTimelineDuration]);



  // Handle range split operation with real audio processing - creates 3 clips
  const handleRangeSplit = useCallback((clipOrGroupId: string, startOffset: number, endOffset: number) => {
    console.log(`✂️ Range split: ${clipOrGroupId} from ${startOffset.toFixed(2)}s to ${endOffset.toFixed(2)}s`);
    
    // Check if this is a group ID or clip ID
    const allClips = timelineState.tracks.flatMap((track) => track.clips);
    const group = timelineState.groups.find((g) => g.id === clipOrGroupId);
    
    if (group) {
      // This is a group - split all clips in the group within the selected range
      console.log(`   📋 Group split: ${group.name} (${group.clipIds.length} clips)`);
      console.log(`   🎯 Range: ${startOffset.toFixed(2)}s - ${endOffset.toFixed(2)}s`);
      
      // Calculate absolute time range
      const groupClips = allClips.filter(clip => group.clipIds.includes(clip.id));
      if (groupClips.length === 0) {
        console.error(`❌ No clips found in group ${clipOrGroupId}`);
        return;
      }
      
      const groupStartTime = Math.min(...groupClips.map(c => c.startTime));
      const absoluteStartTime = groupStartTime + startOffset;
      const absoluteEndTime = groupStartTime + endOffset;
      
      console.log(`   🌍 Absolute range: ${absoluteStartTime.toFixed(2)}s - ${absoluteEndTime.toFixed(2)}s`);
      
      // Split each clip in the group that intersects with the selected range
      groupClips.forEach(clip => {
        // Check if this clip intersects with the selected range
        if (clip.endTime > absoluteStartTime && clip.startTime < absoluteEndTime) {
          // Calculate relative offsets within this clip
          const clipRelativeStart = Math.max(0, absoluteStartTime - clip.startTime);
          const clipRelativeEnd = Math.min(clip.duration, absoluteEndTime - clip.startTime);
          
          console.log(`   ✂️ Splitting clip ${clip.name}: ${clipRelativeStart.toFixed(2)}s - ${clipRelativeEnd.toFixed(2)}s`);
          
          // Call range split on this individual clip
          handleRangeSplit(clip.id, clipRelativeStart, clipRelativeEnd);
        }
      });
      
      return;
    }
    
    // This is an individual clip
    const clip = allClips.find((c) => c.id === clipOrGroupId);
    if (!clip) {
      console.error(`❌ Clip ${clipOrGroupId} not found for split operation`);
      return;
    }
    
    console.log(`   📋 Individual clip split: ${clip.name}`);
    console.log(`   This will create THREE clips: before, selected, and after`);

    console.log(`   📋 Original clip: duration=${clip.duration.toFixed(2)}s, sourceStart=${clip.sourceStartOffset.toFixed(2)}s`);

    // Find the corresponding audio track data
    const audioTrack = audioTracks.find(track => 
      track.name === clip.name || track.file.name.includes(clip.name)
    );

    const newClips: TimelineClip[] = [];
    const newAudioSegments: AudioTrackSegment[] = [];

    // Create new clips and audio segments
    if (audioTrack && audioTrack.channelData) {
      const sampleRate = audioTrack.sampleRate;
      const originalData = audioTrack.channelData;

      // First segment (before the selected range)
      if (startOffset > 0) {
        const sourceStartSample = Math.floor(clip.sourceStartOffset * sampleRate);
        const firstSegmentEndSample = sourceStartSample + Math.floor(startOffset * sampleRate);
        const firstSegmentData = originalData.slice(sourceStartSample, firstSegmentEndSample);
        const firstWaveform = generateWaveformFromAudio(firstSegmentData, sampleRate);
        
        const beforeClipId = `${clip.id}-before-${Date.now()}`;
        const beforeClip = {
          ...clip,
          id: beforeClipId,
          endTime: clip.startTime + startOffset,
          duration: startOffset,
          selected: false,
          waveformData: firstWaveform,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset,
        };
        newClips.push(beforeClip);
        
        newAudioSegments.push({
          clipId: beforeClipId,
          startTime: beforeClip.startTime,
          duration: beforeClip.duration,
          audioData: firstSegmentData
        });
        
        console.log(`   📦 Created BEFORE segment: duration=${startOffset.toFixed(2)}s, sourceStart=${clip.sourceStartOffset.toFixed(2)}s`);
      }

      // Second segment (the selected range itself)
      const sourceStartSample = Math.floor(clip.sourceStartOffset * sampleRate);
      const selectedSegmentStartSample = sourceStartSample + Math.floor(startOffset * sampleRate);
      const selectedSegmentEndSample = sourceStartSample + Math.floor(endOffset * sampleRate);
      const selectedSegmentData = originalData.slice(selectedSegmentStartSample, selectedSegmentEndSample);
      const selectedWaveform = generateWaveformFromAudio(selectedSegmentData, sampleRate);
      
      const selectedClipId = `${clip.id}-selected-${Date.now()}`;
      const selectedClip = {
        ...clip,
        id: selectedClipId,
        startTime: clip.startTime + startOffset,
        endTime: clip.startTime + endOffset,
        duration: endOffset - startOffset,
        selected: true,
        waveformData: selectedWaveform,
        waveformColor: clip.waveformColor,
        sourceStartOffset: clip.sourceStartOffset + startOffset,
      };
      newClips.push(selectedClip);
      
      newAudioSegments.push({
        clipId: selectedClipId,
        startTime: selectedClip.startTime,
        duration: selectedClip.duration,
        audioData: selectedSegmentData
      });
      
      console.log(`   📦 Created SELECTED segment: duration=${(endOffset - startOffset).toFixed(2)}s, sourceStart=${(clip.sourceStartOffset + startOffset).toFixed(2)}s`);

      // Third segment (after the selected range)
      if (endOffset < clip.duration) {
        const secondSegmentStartSample = sourceStartSample + Math.floor(endOffset * sampleRate);
        const secondSegmentEndSample = sourceStartSample + Math.floor(clip.duration * sampleRate);
        const secondSegmentData = originalData.slice(secondSegmentStartSample, secondSegmentEndSample);
        const secondWaveform = generateWaveformFromAudio(secondSegmentData, sampleRate);
        
        const afterClipId = `${clip.id}-after-${Date.now()}`;
        const afterClip = {
          ...clip,
          id: afterClipId,
          startTime: clip.startTime + endOffset,
          endTime: clip.endTime,
          duration: clip.duration - endOffset,
          selected: false,
          waveformData: secondWaveform,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset + endOffset,
        };
        newClips.push(afterClip);
        
        newAudioSegments.push({
          clipId: afterClipId,
          startTime: afterClip.startTime,
          duration: afterClip.duration,
          audioData: secondSegmentData
        });
        
        console.log(`   📦 Created AFTER segment: duration=${(clip.duration - endOffset).toFixed(2)}s, sourceStart=${(clip.sourceStartOffset + endOffset).toFixed(2)}s`);
      }
      
      console.log(`   🎵 Created ${newAudioSegments.length} audio segments for split clips`);
    } else {
      // Fallback for clips without audio data
      console.log(`   ⚠️ No audio data found for ${clip.name}, creating clips without audio segments`);
      
      if (startOffset > 0) {
        newClips.push({
          ...clip,
          id: `${clip.id}-before-${Date.now()}`,
          endTime: clip.startTime + startOffset,
          duration: startOffset,
          selected: false,
          waveformData: clip.waveformData,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset,
        });
      }

      newClips.push({
        ...clip,
        id: `${clip.id}-selected-${Date.now()}`,
        startTime: clip.startTime + startOffset,
        endTime: clip.startTime + endOffset,
        duration: endOffset - startOffset,
        selected: true,
        waveformData: clip.waveformData,
        waveformColor: clip.waveformColor,
        sourceStartOffset: clip.sourceStartOffset + startOffset,
      });

      if (endOffset < clip.duration) {
        newClips.push({
          ...clip,
          id: `${clip.id}-after-${Date.now()}`,
          startTime: clip.startTime + endOffset,
          endTime: clip.endTime,
          duration: clip.duration - endOffset,
          selected: false,
          waveformData: clip.waveformData,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset + endOffset,
        });
      }
    }

    // Update audio tracks with new segments FIRST
    if (newAudioSegments.length > 0 && audioTrack) {
      setAudioTracks(prev => prev.map(track => {
        if (track.name === clip.name || track.file.name.includes(clip.name)) {
          // Remove old segments for this clip if they exist
          const filteredSegments = (track.segments || []).filter((seg: AudioTrackSegment) => seg.clipId !== clip.id);
          
          return {
            ...track,
            segments: [
              ...filteredSegments,
              ...newAudioSegments
            ]
          };
        }
        return track;
      }));
    }

    // Update timeline state with new clips
    setTimelineState((prev) => {
      const updatedTracks = prev.tracks.map((track) => ({
        ...track,
        clips: track.clips.flatMap((c) => {
          if (c.id !== clip.id) return c;
          return newClips;
        }),
      }));

      // Recalculate timeline duration
      const newDuration = calculateTimelineDuration(updatedTracks);

      // Find the selected clip ID from the new clips  
      const selectedClipId = newClips.find(clip => clip.selected)?.id || null;

      return {
        ...prev,
        tracks: updatedTracks,
        selectedClips: selectedClipId ? [selectedClipId] : [],
        totalDuration: newDuration,
      };
    });
    
    // Clear the range selection after split
    setRangeSelection(null);
  }, [audioTracks, timelineState.tracks, generateWaveformFromAudio, calculateTimelineDuration]);

  // Handle range-based delete operation with gap preservation
  const handleRangeDelete = useCallback((clipOrGroupId: string, startOffset: number, endOffset: number) => {
    console.log(`🗑️ Range delete: ${clipOrGroupId} from ${startOffset.toFixed(2)}s to ${endOffset.toFixed(2)}s - creating gap`);
    
    // Check if this is a group ID or clip ID
    const allClips = timelineState.tracks.flatMap((track) => track.clips);
    const group = timelineState.groups.find((g) => g.id === clipOrGroupId);
    
    if (group) {
      // This is a group - delete range from all clips in the group within the selected range
      console.log(`   📋 Group range delete: ${group.name} (${group.clipIds.length} clips)`);
      console.log(`   🎯 Range: ${startOffset.toFixed(2)}s - ${endOffset.toFixed(2)}s`);
      
      // Calculate absolute time range
      const groupClips = allClips.filter(clip => group.clipIds.includes(clip.id));
      if (groupClips.length === 0) {
        console.error(`❌ No clips found in group ${clipOrGroupId}`);
        return;
      }
      
      const groupStartTime = Math.min(...groupClips.map(c => c.startTime));
      const absoluteStartTime = groupStartTime + startOffset;
      const absoluteEndTime = groupStartTime + endOffset;
      
      console.log(`   🌍 Absolute range: ${absoluteStartTime.toFixed(2)}s - ${absoluteEndTime.toFixed(2)}s`);
      
      // Delete range from each clip in the group that intersects with the selected range
      groupClips.forEach(clip => {
        // Check if this clip intersects with the selected range
        if (clip.endTime > absoluteStartTime && clip.startTime < absoluteEndTime) {
          // Calculate relative offsets within this clip
          const clipRelativeStart = Math.max(0, absoluteStartTime - clip.startTime);
          const clipRelativeEnd = Math.min(clip.duration, absoluteEndTime - clip.startTime);
          
          console.log(`   🗑️ Deleting from clip ${clip.name}: ${clipRelativeStart.toFixed(2)}s - ${clipRelativeEnd.toFixed(2)}s`);
          
          // Call range delete on this individual clip
          handleRangeDelete(clip.id, clipRelativeStart, clipRelativeEnd);
        }
      });
      
      return;
    }
    
    // This is an individual clip
    const clip = allClips.find((c) => c.id === clipOrGroupId);
    if (!clip) {
      console.error(`❌ Clip ${clipOrGroupId} not found for delete operation`);
      return;
    }
    
    console.log(`   📋 Individual clip range delete: ${clip.name}`);

    // Find the corresponding audio track data
    const audioTrack = audioTracks.find(track => 
      track.name === clip.name || track.file.name.includes(clip.name)
    );

    const newClips: TimelineClip[] = [];
    const newAudioSegments: AudioTrackSegment[] = [];

    // Create new clips and audio segments
    if (audioTrack && audioTrack.channelData) {
      const sampleRate = audioTrack.sampleRate;
      const originalData = audioTrack.channelData;
      
      // Keep first part (before deleted range)
      if (startOffset > 0) {
        const sourceStartSample = Math.floor(clip.sourceStartOffset * sampleRate);
        const firstSegmentData = originalData.slice(sourceStartSample, sourceStartSample + Math.floor(startOffset * sampleRate));
        const firstWaveform = generateWaveformFromAudio(firstSegmentData, sampleRate);
        
        const beforeClipId = `${clip.id}-before-${Date.now()}`;
        const beforeClip = {
          ...clip,
          id: beforeClipId,
          endTime: clip.startTime + startOffset,
          duration: startOffset,
          selected: false,
          waveformData: firstWaveform,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset,
        };
        newClips.push(beforeClip);
        
        newAudioSegments.push({
          clipId: beforeClipId,
          startTime: beforeClip.startTime,
          duration: beforeClip.duration,
          audioData: firstSegmentData
        });
      }

      // Keep second part (after deleted range) - preserve original timeline position to create gap
      if (endOffset < clip.duration) {
        const sourceStartSample = Math.floor(clip.sourceStartOffset * sampleRate);
        const sourceEndOffsetSample = sourceStartSample + Math.floor(endOffset * sampleRate);
        const secondSegmentData = originalData.slice(sourceEndOffsetSample, sourceStartSample + Math.floor(clip.duration * sampleRate));
        const secondWaveform = generateWaveformFromAudio(secondSegmentData, sampleRate);
        
        const afterClipId = `${clip.id}-after-${Date.now()}`;
        const afterClip = {
          ...clip,
          id: afterClipId,
          startTime: clip.startTime + endOffset, // Keep original timeline position to create gap
          endTime: clip.endTime,
          duration: clip.duration - endOffset,
          selected: false,
          waveformData: secondWaveform,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset + endOffset,
        };
        newClips.push(afterClip);
        
        newAudioSegments.push({
          clipId: afterClipId,
          startTime: afterClip.startTime,
          duration: afterClip.duration,
          audioData: secondSegmentData
        });
      }
      
      console.log(`   🎵 Created ${newAudioSegments.length} audio segments for delete operation`);
    } else {
      // Fallback for clips without audio data
      console.log(`   ⚠️ No audio data found for ${clip.name}, creating clips without audio segments`);
      
      if (startOffset > 0) {
        newClips.push({
          ...clip,
          id: `${clip.id}-before-${Date.now()}`,
          endTime: clip.startTime + startOffset,
          duration: startOffset,
          selected: false,
          waveformData: clip.waveformData,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset,
        });
      }

      if (endOffset < clip.duration) {
        newClips.push({
          ...clip,
          id: `${clip.id}-after-${Date.now()}`,
          startTime: clip.startTime + endOffset,
          endTime: clip.endTime,
          duration: clip.duration - endOffset,
          selected: false,
          waveformData: clip.waveformData,
          waveformColor: clip.waveformColor,
          sourceStartOffset: clip.sourceStartOffset + endOffset,
        });
      }
    }

    // Update audio tracks with new segments FIRST
    if (newAudioSegments.length > 0 && audioTrack) {
      setAudioTracks(prev => prev.map(track => {
        if (track.name === clip.name || track.file.name.includes(clip.name)) {
          // Remove old segments for this clip if they exist
          const filteredSegments = (track.segments || []).filter((seg: AudioTrackSegment) => seg.clipId !== clip.id);
          
          return {
            ...track,
            segments: [
              ...filteredSegments,
              ...newAudioSegments
            ]
          };
        }
        return track;
      }));
    }

    // Update timeline state with new clips
    setTimelineState((prev) => {
      const updatedTracks = prev.tracks.map((track) => ({
        ...track,
        clips: track.clips.flatMap((c) => {
          if (c.id !== clip.id) return c;
          return newClips;
        }),
      }));

      // Recalculate timeline duration
      const newDuration = calculateTimelineDuration(updatedTracks);

      return {
        ...prev,
        tracks: updatedTracks,
        selectedClips: [],
        totalDuration: newDuration,
      };
    });
    
    // Clear the range selection after delete
    setRangeSelection(null);
  }, [audioTracks, timelineState.tracks, generateWaveformFromAudio, calculateTimelineDuration]);

  // Handle delete operation for multiple clips
  const handleDelete = useCallback(() => {
    // If we have a range selection, trigger range delete
    if (rangeSelection) {
      console.log(`🗑️ Using range delete for ${rangeSelection.clipId}`);
      handleRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
      setRangeSelection(null); // Clear the range selection after delete
      return;
    }

    // Fallback to full clip deletion
    const selectedClipIds = timelineState.selectedClips;
    if (selectedClipIds.length === 0) {
      console.log('⚠️ No clips selected for delete operation');
      return;
    }

    // Check if we're deleting collapsed groups
    const selectedGroups = timelineState.groups.filter(group => 
      group.collapsed && group.clipIds.some(clipId => selectedClipIds.includes(clipId))
    );
    
    if (selectedGroups.length > 0) {
      console.log(`🗑️ Group delete - deleting ${selectedGroups.length} collapsed group(s) containing ${selectedClipIds.length} clip(s)`);
    } else {
      console.log(`🗑️ Delete ${selectedClipIds.length} clip(s)`);
    }

    setTimelineState((prev) => {
      const updatedTracks = prev.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter(
          (clip) => !selectedClipIds.includes(clip.id),
        ),
      }));

      // Recalculate timeline duration
      const newDuration = calculateTimelineDuration(updatedTracks);

      return {
        ...prev,
        tracks: updatedTracks,
        selectedClips: [], // Clear selection after delete
        totalDuration: newDuration,
      };
    });
  }, [rangeSelection, timelineState.selectedClips, calculateTimelineDuration, handleRangeDelete]);

  // Handle group operation
  const handleGroup = useCallback(() => {
    const selectedClipIds = timelineState.selectedClips;
    if (selectedClipIds.length < 2) return;

    const groupId = `group-${Date.now()}`;
    const groupColors = [
      "#E961FF",
      "#61E9FF",
      "#61FF61",
      "#FFE961",
      "#FF6161",
    ];
    const groupColor =
      groupColors[
        timelineState.groups.length % groupColors.length
      ];

    setTimelineState((prev) => {
      // Find the track of the first selected clip to assign the group to
      const firstSelectedClip = prev.tracks
        .flatMap(track => track.clips)
        .find(clip => selectedClipIds.includes(clip.id));
      const groupTrackId = firstSelectedClip?.trackId || prev.tracks[0]?.id || '';

      return {
        ...prev,
        groups: [
          ...prev.groups,
          {
            id: groupId,
            name: "Tracks group",
            clipIds: selectedClipIds,
            color: groupColor,
            collapsed: false, // New groups start expanded
            trackId: groupTrackId,
          },
        ],
        tracks: prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (selectedClipIds.includes(clip.id)) {
              // Assign groupTrackIndex based on selection order
              const groupTrackIndex = selectedClipIds.indexOf(clip.id);
              return { ...clip, groupId, groupTrackIndex };
            }
            return clip;
          }),
        })),
      };
    });
  }, [
    timelineState.selectedClips,
    timelineState.groups.length,
  ]);

  // Handle ungroup operation
  const handleUngroup = useCallback(() => {
    const selectedClipIds = timelineState.selectedClips;
    if (selectedClipIds.length === 0) return;

    const allClips = timelineState.tracks.flatMap(
      (track) => track.clips,
    );
    const groupIdsToRemove = new Set<string>();

    selectedClipIds.forEach((clipId) => {
      const clip = allClips.find((c) => c.id === clipId);
      if (clip && clip.groupId) {
        groupIdsToRemove.add(clip.groupId);
      }
    });

    setTimelineState((prev) => ({
      ...prev,
      groups: prev.groups.filter(
        (group) => !groupIdsToRemove.has(group.id),
      ),
      tracks: prev.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (
            clip.groupId &&
            groupIdsToRemove.has(clip.groupId)
          ) {
            const { groupId, groupTrackIndex, ...clipWithoutGroup } = clip;
            return clipWithoutGroup;
          }
          return clip;
        }),
      })),
    }));
  }, [timelineState.selectedClips, timelineState.tracks]);

  // Handle group expand (from collapsed group component)
  const handleExpandGroup = useCallback((groupId: string) => {
    setTimelineState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId
          ? { ...group, collapsed: false }
          : group
      ),
    }));
    
    console.log(`📖 Expanded group ${groupId}`);
  }, []);

  // Handle group collapse (from expanded group header)
  const handleCollapseGroup = useCallback((groupId: string) => {
    setTimelineState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId
          ? { ...group, collapsed: true }
          : group
      ),
    }));
    
    console.log(`📁 Collapsed group ${groupId}`);
  }, []);

  // Handle group click (selection/deselection)
  const handleGroupClick = useCallback((groupId: string, event: React.MouseEvent) => {
    console.log(`👆 Group clicked: ${groupId}`);
    
    // Find all clips in this group
    const group = timelineState.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Use the existing clip selection logic but with all group clip IDs
    const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey;
    
    setTimelineState((prev) => {
      let newSelectedClips: string[];
      
      if (isMultiSelect) {
        // Multi-select: toggle selection of the group
        const allSelected = group.clipIds.every((id) =>
          prev.selectedClips.includes(id),
        );
        if (allSelected) {
          // Remove all clips in group from selection
          newSelectedClips = prev.selectedClips.filter(
            (id) => !group.clipIds.includes(id),
          );
        } else {
          // Add all clips in group to selection
          newSelectedClips = [
            ...new Set([
              ...prev.selectedClips,
              ...group.clipIds,
            ]),
          ];
        }
      } else {
        // Single click: check if group is already selected
        const isAlreadySelected = group.clipIds.every((id) =>
          prev.selectedClips.includes(id),
        );
        
        if (isAlreadySelected && group.clipIds.length === prev.selectedClips.length) {
          // If clicking on the only selected group, deselect it
          newSelectedClips = [];
          console.log('🔄 Deselected group by clicking on selected group');
        } else {
          // Select the entire group
          newSelectedClips = group.clipIds;
        }
      }

      return {
        ...prev,
        selectedClips: newSelectedClips,
        tracks: prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            ...clip,
            selected: newSelectedClips.includes(clip.id),
          })),
        })),
      };
    });
  }, [timelineState.groups]);

  // Handle group mouse down (for dragging collapsed groups)
  const handleGroupMouseDown = useCallback((
    groupId: string,
    event: React.MouseEvent,
    dragType: "move" | "trim-start" | "trim-end"
  ) => {
    console.log(`🖱️ Group mouse down: ${groupId}, dragType: ${dragType}, collapsed: ${timelineState.groups.find(g => g.id === groupId)?.collapsed}`);
    
    // Find the group and its clips
    const group = timelineState.groups.find(g => g.id === groupId);
    if (!group) {
      console.log(`❌ Group ${groupId} not found!`);
      return;
    }
    
    console.log(`📋 Group has ${group.clipIds.length} clips:`, group.clipIds);
    
    // Select the group if not already selected
    const isGroupSelected = group.clipIds.every(id => 
      timelineState.selectedClips.includes(id));
    
    console.log(`🔍 Group selected: ${isGroupSelected}, current selection:`, timelineState.selectedClips);
    
    if (!isGroupSelected) {
      console.log(`🎯 Selecting group clips:`, group.clipIds);
      setTimelineState((prev) => ({
        ...prev,
        selectedClips: group.clipIds,
        tracks: prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            ...clip,
            selected: group.clipIds.includes(clip.id),
          })),
        })),
      }));
    }
    
    // Use the existing mouse down logic with the primary clip ID
    if (group.clipIds.length > 0) {
      const primaryClipId = group.clipIds[0]; // Use first clip as primary
      console.log(`🎯 Using primary clip ID: ${primaryClipId}`);
      handleClipMouseDown(primaryClipId, event, dragType);
    }
  }, [timelineState.groups, timelineState.selectedClips, handleClipMouseDown]);

  // Audio playback state management
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackIntervalRef = useRef<number | null>(null);

  // Handle play/pause with proper audio mixing
  const handlePlayPause = useCallback(() => {
    console.log(`🎮 Play/Pause clicked. Current state: ${timelineState.isPlaying ? 'Playing' : 'Paused'}, Audio tracks: ${audioTracks.length}`);
    
    setTimelineState((prev) => {
      const newIsPlaying = !prev.isPlaying;
      
      if (newIsPlaying && audioTracks.length > 0) {
        console.log(`▶️ Starting playback from ${prev.playheadPosition.toFixed(2)}s`);
        console.log(`🎵 Available audio tracks:`, audioTracks.map(t => ({ name: t.name, duration: t.duration })));
        
        try {
          // Create a single AudioContext for all tracks
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const audioContext = audioContextRef.current;
          
          // Resume AudioContext if suspended (required by browser autoplay policies)
          if (audioContext.state === 'suspended') {
            console.log('🔊 Resuming suspended AudioContext...');
            audioContext.resume().then(() => {
              console.log('✅ AudioContext resumed successfully');
            }).catch((error) => {
              console.error('❌ Failed to resume AudioContext:', error);
            });
          }
          
          // Create master gain node for volume control
          const masterGain = audioContext.createGain();
          masterGain.gain.value = 0.8;
          masterGain.connect(audioContext.destination);
          
          // Find all clips that should be playing at the current time
          const currentTime = prev.playheadPosition;
          const activeClips = prev.tracks.flatMap(track => track.clips).filter(clip => 
            clip.startTime <= currentTime && clip.endTime > currentTime
          );
          
          console.log(`🎵 Found ${activeClips.length} active clips at time ${currentTime.toFixed(2)}s`);
          
          // Clear any existing sources
          activeSourcesRef.current.forEach(source => {
            try {
              source.stop();
              source.disconnect();
            } catch (e) {
              // Source might already be stopped
            }
          });
          activeSourcesRef.current = [];
          
          // Create and start sources for each active clip
          activeClips.forEach((clip) => {
            try {
              // Find the corresponding audio track
              const audioTrack = audioTracks.find(track => 
                track.name === clip.name || track.file.name.includes(clip.name) || 
                track.file.name.split('.')[0] === clip.name
              );
              
              console.log(`🔍 Looking for audio track for clip "${clip.name}", found:`, audioTrack ? audioTrack.name : 'NOT FOUND');
              
              if (!audioTrack) {
                console.warn(`⚠️ No audio track found for clip ${clip.name}`);
                return;
              }
              
              // Calculate offset within the clip
              const clipOffset = currentTime - clip.startTime;
              
              // Get the correct audio data
              let audioData: Float32Array;
              let startOffsetInData = 0;
              
              // Check if this clip has processed audio segments
              const trackSegment = (audioTrack as any).segments?.find((seg: AudioTrackSegment) => seg.clipId === clip.id);
              if (trackSegment && trackSegment.audioData) {
                // Use processed segment data
                audioData = trackSegment.audioData;
                startOffsetInData = clipOffset * audioTrack.sampleRate;
                console.log(`🔧 Using processed segment for ${clip.name}, offset: ${clipOffset.toFixed(2)}s`);
              } else {
                // Use original audio data with source offset
                audioData = audioTrack.channelData;
                startOffsetInData = (clip.sourceStartOffset + clipOffset) * audioTrack.sampleRate;
                console.log(`🎼 Using original audio for ${clip.name}, source offset: ${clip.sourceStartOffset.toFixed(2)}s, clip offset: ${clipOffset.toFixed(2)}s`);
              }
              
              // Ensure we don't go beyond the audio data
              const maxStartSample = Math.max(0, Math.min(Math.floor(startOffsetInData), audioData.length - 1));
              const remainingDuration = (clip.endTime - currentTime);
              const maxSamples = Math.floor(remainingDuration * audioTrack.sampleRate);
              const remainingData = audioData.slice(maxStartSample, maxStartSample + maxSamples);
              
              if (remainingData.length > 0) {
                // Create audio buffer for this clip
                const playbackBuffer = audioContext.createBuffer(1, remainingData.length, audioTrack.sampleRate);
                playbackBuffer.copyToChannel(remainingData, 0);
                
                // Create and configure audio source
                const source = audioContext.createBufferSource();
                source.buffer = playbackBuffer;
                
                // Create individual gain node for this track (lower volume per track to prevent distortion)
                const trackGain = audioContext.createGain();
                trackGain.gain.value = Math.min(0.7 / activeClips.length, 0.5); // Normalize volume based on number of active clips
                
                // Connect: source -> trackGain -> masterGain -> destination
                source.connect(trackGain);
                trackGain.connect(masterGain);
                
                // Start playback immediately
                source.start(0);
                activeSourcesRef.current.push(source);
                
                console.log(`✅ Started playback for ${clip.name} (volume: ${trackGain.gain.value.toFixed(2)})`);
                
                // Handle source completion
                source.onended = () => {
                  const index = activeSourcesRef.current.indexOf(source);
                  if (index > -1) {
                    activeSourcesRef.current.splice(index, 1);
                  }
                };
              }
              
            } catch (error) {
              console.error(`❌ Error playing clip ${clip.name}:`, error);
            }
          });
          
          // Update playhead position in real-time during playback
          const startTime = Date.now();
          const startPosition = currentTime;
          
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
          
          playbackIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const newPosition = startPosition + elapsed;
            
            setTimelineState(current => {
              if (!current.isPlaying || newPosition >= current.totalDuration) {
                // Stop playback
                activeSourcesRef.current.forEach(source => {
                  try {
                    source.stop();
                    source.disconnect();
                  } catch (e) {
                    // Source might already be stopped
                  }
                });
                activeSourcesRef.current = [];
                
                if (playbackIntervalRef.current) {
                  clearInterval(playbackIntervalRef.current);
                  playbackIntervalRef.current = null;
                }
                
                return {
                  ...current,
                  isPlaying: false,
                  playheadPosition: Math.min(newPosition, current.totalDuration)
                };
              }
              return {
                ...current,
                playheadPosition: newPosition
              };
            });
          }, 50);
          
        } catch (error) {
          console.error('❌ Error in audio playback:', error);
        }
      } else if (newIsPlaying && audioTracks.length === 0) {
        console.warn('⚠️ No audio tracks available for playback. Please load audio files first.');
      } else if (!newIsPlaying) {
        console.log('⏸️ Pausing playback');
        
        // Stop all active sources
        activeSourcesRef.current.forEach(source => {
          try {
            source.stop();
            source.disconnect();
          } catch (e) {
            // Source might already be stopped
          }
        });
        activeSourcesRef.current = [];
        
        // Clear playback interval
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      }
      
      return {
        ...prev,
        isPlaying: newIsPlaying,
      };
    });
  }, [audioTracks]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      // Stop all sources
      activeSourcesRef.current.forEach(source => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {
          // Source might already be stopped
        }
      });
      
      // Clear interval
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setTimelineState((prev) => {
      const newZoomLevel = Math.min(prev.zoomLevel * 1.2, 3);
      console.log(`🔍 Zoom In: ${prev.zoomLevel.toFixed(2)}x → ${newZoomLevel.toFixed(2)}x`);
      return {
        ...prev,
        zoomLevel: newZoomLevel,
      };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setTimelineState((prev) => {
      const newZoomLevel = Math.max(prev.zoomLevel / 1.2, 0.5);
      console.log(`🔍 Zoom Out: ${prev.zoomLevel.toFixed(2)}x → ${newZoomLevel.toFixed(2)}x`);
      return {
        ...prev,
        zoomLevel: newZoomLevel,
      };
    });
  }, []);

  const handleZoomSlider = useCallback((value: number) => {
    setTimelineState((prev) => {
      console.log(`🔍 Zoom Slider: ${prev.zoomLevel.toFixed(2)}x → ${value.toFixed(2)}x`);
      return {
        ...prev,
        zoomLevel: value,
      };
    });
  }, []);

  // handleTrackAdded removed - functionality integrated into handleFileSelect

  // Helper function to process raw audio files
  const processRawAudioFile = useCallback(async (file: File, arrayBuffer: ArrayBuffer) => {
    console.log(`🎵 Processing RAW audio file: ${file.name}...`);
    
    // Default parameters for raw audio - these are common values
    // In a production app, you might want to show a dialog to let users set these
    const defaultParams = {
      sampleRate: 44100,      // 44.1 kHz (CD quality)
      channels: 1,            // Mono
      bitDepth: 16,           // 16-bit
      isLittleEndian: true    // Little endian byte order
    };
    
    // You could add a UI dialog here to let users specify these parameters
    // For now, we'll use sensible defaults and log them
    console.log(`📊 Using default RAW parameters:`, defaultParams);
    
    const { sampleRate, channels, bitDepth, isLittleEndian } = defaultParams;
    const bytesPerSample = bitDepth / 8;
    const totalSamples = arrayBuffer.byteLength / (bytesPerSample * channels);
    const duration = totalSamples / sampleRate;
    
    console.log(`📈 RAW file stats: ${totalSamples} samples, ${duration.toFixed(2)}s duration`);
    
    // Create AudioContext for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create AudioBuffer manually
    const audioBuffer = audioContext.createBuffer(channels, totalSamples, sampleRate);
    
    // Convert raw data to Float32Array based on bit depth
    const dataView = new DataView(arrayBuffer);
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < totalSamples; i++) {
        let sample = 0;
        const byteOffset = (i * channels + channel) * bytesPerSample;
        
        if (byteOffset + bytesPerSample <= arrayBuffer.byteLength) {
          if (bitDepth === 16) {
            // 16-bit signed integer
            sample = dataView.getInt16(byteOffset, isLittleEndian) / 32768.0;
          } else if (bitDepth === 24) {
            // 24-bit signed integer (not directly supported, need manual parsing)
            let value = 0;
            if (isLittleEndian) {
              value = dataView.getUint8(byteOffset) | 
                     (dataView.getUint8(byteOffset + 1) << 8) | 
                     (dataView.getInt8(byteOffset + 2) << 16);
            } else {
              value = (dataView.getInt8(byteOffset) << 16) | 
                     (dataView.getUint8(byteOffset + 1) << 8) | 
                     dataView.getUint8(byteOffset + 2);
            }
            sample = value / 8388608.0; // 2^23
          } else if (bitDepth === 32) {
            // 32-bit signed integer
            sample = dataView.getInt32(byteOffset, isLittleEndian) / 2147483648.0;
          } else if (bitDepth === 8) {
            // 8-bit unsigned integer
            sample = (dataView.getUint8(byteOffset) - 128) / 128.0;
          }
        }
        
        channelData[i] = Math.max(-1, Math.min(1, sample)); // Clamp to valid range
      }
    }
    
    console.log(`✅ RAW audio processed: ${duration.toFixed(2)}s, ${channels} channel(s), ${sampleRate}Hz`);
    
    return { audioBuffer, audioContext };
  }, []);

  // Handle file selection for audio tracks
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Color cycling for track colors
    const trackColors = [
      '#E961FF', '#4CAF50', '#FF9800', '#2196F3', '#F44336', 
      '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B'
    ];
    
    for (const file of Array.from(files)) {
      const fileName = file.name.toLowerCase();
      const isRawFile = fileName.endsWith('.raw') || fileName.endsWith('.pcm');
      const isWavFile = fileName.endsWith('.wav');
      const isStandardAudio = file.type.startsWith('audio/') || isWavFile;
      const isAudioFile = isStandardAudio || isRawFile;
      
      if (!isAudioFile) {
        console.warn(`Skipping non-audio file: ${file.name} (type: ${file.type})`);
        continue;
      }
      
      // Determine file type for logging
      let fileTypeLabel = 'audio';
      if (isRawFile) fileTypeLabel = 'RAW';
      else if (isWavFile) fileTypeLabel = 'WAV';
      else if (file.type.includes('mp3')) fileTypeLabel = 'MP3';
      else if (file.type.includes('flac')) fileTypeLabel = 'FLAC';
      else if (file.type.includes('ogg')) fileTypeLabel = 'OGG';
      
      try {
        
        console.log(`🎵 Loading ${fileTypeLabel} file: ${file.name}... (MIME: ${file.type})`);
        
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        let audioBuffer: AudioBuffer;
        let audioContext: AudioContext;
        
        if (isRawFile) {
          // Process raw audio file
          const result = await processRawAudioFile(file, arrayBuffer);
          audioBuffer = result.audioBuffer;
          audioContext = result.audioContext;
        } else {
          // Process standard audio file (including WAV) with Web Audio API
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log(`✅ ${fileTypeLabel} decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
        }
        
        // Generate high-quality waveform data from audio buffer
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        
        // Downsample for waveform visualization (target ~500-1000 points)
        const targetSamples = Math.min(1000, Math.max(500, Math.floor(duration * 20)));
        const blockSize = Math.floor(channelData.length / targetSamples);
        const waveformData = new Float32Array(targetSamples);
        
        // Calculate RMS values for each block for better visualization
        for (let i = 0; i < targetSamples; i++) {
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channelData.length);
          
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += channelData[j] * channelData[j];
          }
          
          waveformData[i] = Math.sqrt(sum / (end - start));
        }
        
        // Normalize waveform data
        const maxValue = Math.max(...Array.from(waveformData));
        if (maxValue > 0) {
          for (let i = 0; i < waveformData.length; i++) {
            waveformData[i] = waveformData[i] / maxValue;
          }
        }
        
        // Cycle through colors for each new track
        const trackColor = trackColors[audioTracks.length % trackColors.length];
        
        // Add to timeline
        setTimelineState((prev) => {
          const newClip = {
            id: `audio-track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            trackId: "track-1", // Add to first track for now
            startTime: 0,
            endTime: audioBuffer.duration,
            duration: audioBuffer.duration,
            type: "audio" as const,
            name: file.name.replace(/\.[^/.]+$/, ""),
            color: trackColor,
            selected: false,
            originalWidth: Math.floor(audioBuffer.duration * 20), // Scale factor for visualization
            trackName: file.name.replace(/\.[^/.]+$/, ""),
            waveformData: waveformData,
            waveformColor: trackColor,
            sourceStartOffset: 0,
          };

          const updatedTracks = prev.tracks.map((track, index) => {
            if (index === 0) {
              return {
                ...track,
                clips: [...track.clips, newClip],
              };
            }
            return track;
          });

          // Recalculate timeline duration
          const newDuration = calculateTimelineDuration(updatedTracks);

          return {
            ...prev,
            tracks: updatedTracks,
            totalDuration: newDuration,
          };
        });

        // Store audio data for playback
        setAudioTracks(prev => [...prev, {
          id: `audio-track-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          duration: audioBuffer.duration,
          audioBuffer,
          audioContext,
          waveformData,
          color: trackColor,
          file,
          sampleRate,
          channelData, // Store for real-time processing
          isRawFile, // Flag to indicate this was a raw file
        }]);

        console.log(`✅ Audio track added: ${file.name} (${audioBuffer.duration.toFixed(2)}s) - Color: ${trackColor} [${fileTypeLabel}]`);
        
        // Close AudioContext to prevent memory leaks (we'll create new ones for playback)
        await audioContext.close();
        
      } catch (error) {
        console.error(`❌ Failed to load ${fileTypeLabel} file ${file.name}:`, error);
        
        if (isRawFile) {
          console.info(`💡 RAW file processing tips:
            - Ensure the file contains valid PCM audio data
            - Default parameters used: 44.1kHz, 16-bit, mono, little-endian
            - For different formats, the file might not load correctly`);
        } else if (isWavFile) {
          console.info(`💡 WAV file processing tips:
            - Ensure the file is a valid WAV format
            - Both PCM and compressed WAV formats are supported
            - Check that the file isn't corrupted`);
        } else {
          console.info(`💡 Audio file processing tips:
            - Ensure the file format is supported by your browser
            - Common formats: MP3, WAV, FLAC, OGG, AAC
            - Check that the file isn't corrupted or DRM-protected`);
        }
      }
    }
    
    // Reset file input
    event.target.value = '';
  }, [audioTracks.length, processRawAudioFile]);

  // Global mouse handlers with enhanced drag logic and multi-clip support
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Check if we should start dragging
      if (mouseDownState.isMouseDown && !dragState.isDragging) {
        const deltaX = Math.abs(
          event.clientX - mouseDownState.startX,
        );
        const deltaY = Math.abs(
          event.clientY - mouseDownState.startY,
        );
        const timeDelta = Date.now() - mouseDownState.startTime;

        // Start drag if mouse moved more than 5px or held for more than 150ms
        if (deltaX > 5 || deltaY > 5 || timeDelta > 150) {
          const allClips = timelineState.tracks.flatMap(
            (t) => t.clips,
          );
          const clip = allClips.find(
            (c) => c.id === mouseDownState.clipId,
          );
          if (!clip) return;

          // If the clicked clip is not selected, select it (respecting individual vs group selection)
          let selectedClipIds = timelineState.selectedClips;
          if (!clip.selected) {
            // Check if this clip is individually selected or if we should select the whole group
            const group = clip.groupId ? timelineState.groups.find(g => g.id === clip.groupId) : null;
            const isExpandedGroup = group && !group.collapsed;
            
            // Check if this is an expanded group - individual clips should drag individually
            if (isExpandedGroup) {
              // In expanded groups, maintain individual selection for drag
              selectedClipIds = [clip.id];
              console.log(`🎯 Individual clip drag in expanded group: ${clip.id}`);
            } else {
              // Default behavior: select group (for collapsed groups or ungrouped clips)
              selectedClipIds = getClipsInGroup(clip.id);
              console.log(`👥 Group drag: selecting ${selectedClipIds.length} clips`);
            }
            
            // Update selection state immediately
            setTimelineState((prev) => ({
              ...prev,
              selectedClips: selectedClipIds,
              tracks: prev.tracks.map((track) => ({
                ...track,
                clips: track.clips.map((c) => ({
                  ...c,
                  selected: selectedClipIds.includes(c.id),
                })),
              })),
            }));
          }

          // Get all selected clips for group movement
          const originalClips = allClips.filter((c) =>
            selectedClipIds.includes(c.id),
          );

          // Calculate track offsets relative to the primary clip
          const primaryClipTrackIndex = getTrackIndex(
            clip.trackId,
          );
          const trackOffsets = new Map<string, number>();

          // Check if we're dealing with grouped clips that should maintain rail constraints
          // const isGroupedSelection = originalClips.some(
          //   (c) =>
          //     c.groupId &&
          //     timelineState.groups.some(
          //       (g) => g.id === c.groupId,
          //     ),
          // );

          originalClips.forEach((c) => {
            const clipTrackIndex = getTrackIndex(c.trackId);
            const trackOffset =
              clipTrackIndex - primaryClipTrackIndex;
            trackOffsets.set(c.id, trackOffset);
          });

          setDragState({
            isDragging: true,
            dragType: mouseDownState.dragType,
            clipId: mouseDownState.clipId,
            selectedClipIds,
            startX: mouseDownState.startX,
            startY: mouseDownState.startY,
            startTime:
              mouseDownState.dragType === "trim-end"
                ? clip.endTime
                : clip.startTime,
            originalClips,
            targetTrackId: clip.trackId,
            trackOffsets,
            isValidDrop: true,
            collisionDetected: false,
            dragStarted: true,
            showNewTrackIndicator: false,
          });

          setMouseDownState({
            isMouseDown: false,
            startX: 0,
            startY: 0,
            startTime: 0,
            clipId: null,
            dragType: null,
          });
        }
        return;
      }

      // Continue with existing drag logic
      if (!dragState.isDragging || !containerRef.current)
        return;

      const deltaX = event.clientX - dragState.startX;
      // const deltaY = event.clientY - dragState.startY;
      const deltaTime = pixelToTime(deltaX);

      if (dragState.dragType === "playhead") {
        const newTime = dragState.startTime + deltaTime;
        setTimelineState((prev) => ({
          ...prev,
          playheadPosition: Math.max(0, Math.min(newTime, prev.totalDuration)),
        }));
      } else if (
        dragState.selectedClipIds.length > 0 &&
        dragState.originalClips.length > 0
      ) {
        // Get the primary clip (the one being dragged)
        const primaryClip = dragState.originalClips.find(
          (c) => c.id === dragState.clipId,
        );
        if (!primaryClip) return;

        // Determine target track based on Y position (only for move operations)
        const targetTrack =
          dragState.dragType === "move"
            ? getTrackAtY(event.clientY)
            : null;
        let primaryTargetTrackId = targetTrack
          ? targetTrack.id
          : primaryClip.trackId;
        let primaryTargetTrackIndex = getTrackIndex(
          primaryTargetTrackId,
        );

        // For grouped clips, enforce rail constraints - they must maintain their relative track positions
        const isGroupedDrag = dragState.originalClips.some(
          (c) =>
            c.groupId &&
            timelineState.groups.some(
              (g) => g.id === c.groupId,
            ),
        );

        if (isGroupedDrag && dragState.dragType === "move") {
          // Find the valid range of tracks for this group
          const minTrackOffset = Math.min(
            ...Array.from(dragState.trackOffsets.values()),
          );
          const maxTrackOffset = Math.max(
            ...Array.from(dragState.trackOffsets.values()),
          );

          // Constrain the target track so all clips in the group fit within available tracks
          const minAllowedTrackIndex = Math.max(
            0,
            -minTrackOffset,
          );
          const maxAllowedTrackIndex = Math.min(
            timelineState.tracks.length - 1,
            timelineState.tracks.length - 1 - maxTrackOffset,
          );

          primaryTargetTrackIndex = Math.max(
            minAllowedTrackIndex,
            Math.min(
              maxAllowedTrackIndex,
              primaryTargetTrackIndex,
            ),
          );
          const constrainedTargetTrack = getTrackByIndex(
            primaryTargetTrackIndex,
          );
          primaryTargetTrackId = constrainedTargetTrack
            ? constrainedTargetTrack.id
            : primaryClip.trackId;
        }

        let newStartTime = primaryClip.startTime;
        let newEndTime = primaryClip.endTime;

        // Calculate new position based on drag type for primary clip
        if (dragState.dragType === "move") {
          newStartTime = Math.max(
            0,
            primaryClip.startTime + deltaTime,
          );
          newEndTime = newStartTime + primaryClip.duration;
        } else if (dragState.dragType === "trim-start") {
          newStartTime = Math.max(
            0,
            Math.min(
              primaryClip.startTime + deltaTime,
              primaryClip.endTime - 1,
            ),
          );
        } else if (dragState.dragType === "trim-end") {
          newEndTime = Math.max(
            primaryClip.startTime + 1,
            primaryClip.endTime + deltaTime,
          );
        }

        // Check for snap points
        const snapInfo = dragState.dragType ? findSnapPoints(
          dragState.selectedClipIds,
          dragState.dragType,
          newStartTime,
          newEndTime,
        ) : null;

        let snapAdjustment = 0;
        if (snapInfo) {
          // Apply snap adjustment
          if (dragState.dragType === "move") {
            if (
              Math.abs(
                newStartTime -
                  snapInfo.snapTime +
                  snapInfo.adjustment,
              ) <
              Math.abs(
                newEndTime -
                  snapInfo.snapTime +
                  snapInfo.adjustment,
              )
            ) {
              // Snap to start
              snapAdjustment = snapInfo.snapTime - newStartTime;
            } else {
              // Snap to end
              snapAdjustment = snapInfo.snapTime - newEndTime;
            }
          } else if (dragState.dragType === "trim-start") {
            snapAdjustment = snapInfo.snapTime - newStartTime;
          } else if (dragState.dragType === "trim-end") {
            snapAdjustment = snapInfo.snapTime - newEndTime;
          }

          // Update snap state
          setSnapState({
            isSnapping: true,
            snapPosition: snapInfo.snapTime,
            snapType: snapInfo.snapType,
            targetClipId: snapInfo.targetClipId,
          });
        } else {
          // Clear snap state
          setSnapState({
            isSnapping: false,
            snapPosition: null,
            snapType: null,
            targetClipId: null,
          });
        }

        // For move operations, calculate target positions for all clips
        let collisionDetected = false;
        let isValidDrop = true;

        if (dragState.dragType === "move") {
          // Calculate all clip positions for collision detection
          const clipPositions: Array<{
            clipId: string;
            trackId: string;
            startTime: number;
            endTime: number;
          }> = [];

          dragState.originalClips.forEach((clip) => {
            // Check if this is part of a collapsed group
            const dragClipGroup = clip.groupId ? timelineState.groups.find(g => g.id === clip.groupId) : null;
            const isCollapsedGroup = dragClipGroup && dragClipGroup.collapsed;
            
            let targetTrack;
            if (isCollapsedGroup) {
              // For collapsed groups, ALL clips target the primary track
              targetTrack = getTrackByIndex(primaryTargetTrackIndex);
              console.log(`🎯 Collapsed group clip ${clip.id} targeting primary track index ${primaryTargetTrackIndex} (track ID: ${targetTrack?.id})`);
            } else {
              // For expanded groups or ungrouped clips, maintain relative track relationships
              const trackOffset = dragState.trackOffsets.get(clip.id) || 0;
              const targetTrackIndex = primaryTargetTrackIndex + trackOffset;
              targetTrack = getTrackByIndex(targetTrackIndex);
              console.log(`📍 Clip ${clip.id} targeting track index ${targetTrackIndex} (offset: ${trackOffset}, track ID: ${targetTrack?.id})`);
            }

            if (targetTrack) {
              if (clip.id === dragState.clipId) {
                // Primary clip
                clipPositions.push({
                  clipId: clip.id,
                  trackId: targetTrack.id,
                  startTime: newStartTime + snapAdjustment,
                  endTime: newEndTime + snapAdjustment,
                });
              } else {
                // Other clips - maintain relative time offset
                const timeOffset =
                  newStartTime +
                  snapAdjustment -
                  primaryClip.startTime;
                clipPositions.push({
                  clipId: clip.id,
                  trackId: targetTrack.id,
                  startTime: Math.max(
                    0,
                    clip.startTime + timeOffset,
                  ),
                  endTime: Math.max(
                    0,
                    clip.endTime + timeOffset,
                  ),
                });
              }
            } else {
              // Track doesn't exist - invalid drop
              isValidDrop = false;
            }
          });

          // Check for collisions across all target positions
          if (isValidDrop) {
            collisionDetected = checkMultiTrackCollisions(clipPositions);
            isValidDrop = !collisionDetected;
          }
        }

        // Check if dragging below tracks for new track creation
        const showNewTrackIndicator = isAboveNewTrackZone(event.clientY);
        
        // If dragging in new track zone, set up for new track creation
        if (showNewTrackIndicator) {
          primaryTargetTrackId = 'NEW_TRACK';
          isValidDrop = true;
          collisionDetected = false;
        }

        // Update drag state
        setDragState((prev) => ({
          ...prev,
          targetTrackId: primaryTargetTrackId,
          isValidDrop,
          collisionDetected,
          showNewTrackIndicator,
        }));

        // Update timeline state for visual feedback - move all selected clips maintaining track relationships
        setTimelineState((prev) => {
          const updatedTracks = prev.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => {
              if (!dragState.selectedClipIds.includes(clip.id))
                return clip;

              const originalClip = dragState.originalClips.find(
                (c) => c.id === clip.id,
              );
              if (!originalClip) return clip;

              let clipNewStartTime = originalClip.startTime;
              let clipNewEndTime = originalClip.endTime;
              let clipTargetTrackId = originalClip.trackId;

              if (dragState.dragType === "move") {
                // Check if this is a collapsed group - all clips should move to the same target track
                const targetClipGroup = clip.groupId ? timelineState.groups.find(g => g.id === clip.groupId) : null;
                const isCollapsedGroup = targetClipGroup && targetClipGroup.collapsed;
                
                console.log(`🎯 Visual feedback for clip ${clip.id}: groupId=${clip.groupId}, collapsed=${isCollapsedGroup}, primaryTargetTrackIndex=${primaryTargetTrackIndex}`);
                
                if (isCollapsedGroup) {
                  // For collapsed groups, ALL clips move to the primary target track
                  const targetTrack = getTrackByIndex(primaryTargetTrackIndex);
                  console.log(`📍 Collapsed group clip ${clip.id} targeting track index ${primaryTargetTrackIndex} -> track ${targetTrack?.id} (from ${clip.trackId})`);
                  
                  if (targetTrack) {
                    clipTargetTrackId = targetTrack.id;
                    
                    // Calculate time offset
                    const timeOffset =
                      newStartTime +
                      snapAdjustment -
                      primaryClip.startTime;
                    clipNewStartTime = Math.max(
                      0,
                      originalClip.startTime + timeOffset,
                    );
                    clipNewEndTime =
                      clipNewStartTime + originalClip.duration;
                    
                    console.log(`   ✅ Assigning clip ${clip.id} to track ${clipTargetTrackId} at time ${clipNewStartTime.toFixed(2)}s`);
                  } else {
                    // Invalid target track - keep original position
                    clipTargetTrackId = originalClip.trackId;
                    clipNewStartTime = originalClip.startTime;
                    clipNewEndTime = originalClip.endTime;
                    console.log(`   ❌ Invalid target track, keeping clip ${clip.id} on original track ${clipTargetTrackId}`);
                  }
                } else {
                  // For expanded groups or ungrouped clips, check if we're moving within group tracks
                  const isExpandedGroup = targetClipGroup && !targetClipGroup.collapsed;
                  
                  if (isExpandedGroup) {
                    // Check if we're dragging within the same group
                    const groupTrackIndex = getGroupTrackIndexAtY(targetClipGroup.id, event.clientY);
                    
                    if (groupTrackIndex !== null) {
                      // Moving within the group - update groupTrackIndex but keep same trackId
                      clipTargetTrackId = originalClip.trackId; // Stay in the same main track
                      
                      // Calculate time offset
                      const timeOffset =
                        newStartTime +
                        snapAdjustment -
                        primaryClip.startTime;
                      clipNewStartTime = Math.max(
                        0,
                        originalClip.startTime + timeOffset,
                      );
                      clipNewEndTime =
                        clipNewStartTime + originalClip.duration;
                      
                      console.log(`🎯 Moving clip ${clip.id} to group track ${groupTrackIndex}`);
                    } else {
                      // Moving outside the group - use normal track targeting
                      const trackOffset =
                        dragState.trackOffsets.get(clip.id) || 0;
                      const targetTrackIndex =
                        primaryTargetTrackIndex + trackOffset;
                      const targetTrack =
                        getTrackByIndex(targetTrackIndex);

                      if (targetTrack) {
                        clipTargetTrackId = targetTrack.id;

                        // Calculate time offset
                        const timeOffset =
                          newStartTime +
                          snapAdjustment -
                          primaryClip.startTime;
                        clipNewStartTime = Math.max(
                          0,
                          originalClip.startTime + timeOffset,
                        );
                        clipNewEndTime =
                          clipNewStartTime + originalClip.duration;
                      } else {
                        // Invalid target track - keep original position
                        clipTargetTrackId = originalClip.trackId;
                        clipNewStartTime = originalClip.startTime;
                        clipNewEndTime = originalClip.endTime;
                      }
                    }
                  } else {
                    // For ungrouped clips, maintain relative track relationships
                    const trackOffset =
                      dragState.trackOffsets.get(clip.id) || 0;
                    const targetTrackIndex =
                      primaryTargetTrackIndex + trackOffset;
                    const targetTrack =
                      getTrackByIndex(targetTrackIndex);

                    if (targetTrack) {
                      clipTargetTrackId = targetTrack.id;

                      // Calculate time offset
                      const timeOffset =
                        newStartTime +
                        snapAdjustment -
                        primaryClip.startTime;
                      clipNewStartTime = Math.max(
                        0,
                        originalClip.startTime + timeOffset,
                      );
                      clipNewEndTime =
                        clipNewStartTime + originalClip.duration;
                    } else {
                      // Invalid target track - keep original position
                      clipTargetTrackId = originalClip.trackId;
                      clipNewStartTime = originalClip.startTime;
                      clipNewEndTime = originalClip.endTime;
                    }
                  }
                }

                // Check if we need to update groupTrackIndex for expanded group movement
                let updatedGroupTrackIndex = clip.groupTrackIndex;
                const currentClipGroup = clip.groupId ? timelineState.groups.find(g => g.id === clip.groupId) : null;
                const isCurrentExpandedGroup = currentClipGroup && !currentClipGroup.collapsed;
                if (isCurrentExpandedGroup) {
                  const groupTrackIndex = getGroupTrackIndexAtY(currentClipGroup.id, event.clientY);
                  if (groupTrackIndex !== null) {
                    updatedGroupTrackIndex = groupTrackIndex;
                  }
                }

                return {
                  ...clip,
                  trackId: clipTargetTrackId,
                  startTime: clipNewStartTime,
                  endTime: clipNewEndTime,
                  groupTrackIndex: updatedGroupTrackIndex,
                  selected: true, // Preserve selection state
                  waveformData: clip.waveformData,
                  waveformColor: clip.waveformColor,
                };
              } else if (
                dragState.dragType === "trim-start" &&
                clip.id === dragState.clipId
              ) {
                clipNewStartTime =
                  newStartTime + snapAdjustment;
                // Calculate how much we're trimming from the start
                const trimAmount = clipNewStartTime - originalClip.startTime;
                console.log(`✂️ TRIM START: ${clip.id} by ${trimAmount.toFixed(2)}s, new sourceOffset: ${(originalClip.sourceStartOffset + trimAmount).toFixed(2)}s`);
                return {
                  ...clip,
                  startTime: clipNewStartTime,
                  duration:
                    originalClip.endTime - clipNewStartTime,
                  selected: true,
                  waveformData: clip.waveformData,
                  waveformColor: clip.waveformColor,
                  sourceStartOffset: originalClip.sourceStartOffset + trimAmount, // Update source offset
                };
              } else if (
                dragState.dragType === "trim-end" &&
                clip.id === dragState.clipId
              ) {
                clipNewEndTime = newEndTime + snapAdjustment;
                const trimAmount = originalClip.endTime - clipNewEndTime;
                console.log(`✂️ TRIM END: ${clip.id} by ${trimAmount.toFixed(2)}s, duration: ${(clipNewEndTime - originalClip.startTime).toFixed(2)}s`);
                return {
                  ...clip,
                  endTime: clipNewEndTime,
                  duration:
                    clipNewEndTime - originalClip.startTime,
                  selected: true,
                  waveformData: clip.waveformData,
                  waveformColor: clip.waveformColor,
                  sourceStartOffset: originalClip.sourceStartOffset, // Keep same source offset for end trim
                };
              }

              return clip;
            }),
          }));

          return {
            ...prev,
            tracks: updatedTracks,
            // Don't update totalDuration during drag - only when drag is completed
          };
        });
      }
    };

    const handleMouseUp = () => {
      console.log('🔚 Mouse up handler called', {
        isDragging: dragState.isDragging,
        dragType: dragState.dragType,
        isValidDrop: dragState.isValidDrop,
        collisionDetected: dragState.collisionDetected,
        targetTrackId: dragState.targetTrackId,
        selectedClipIds: dragState.selectedClipIds
      });

      // Handle mouse up from mouse down state (click without drag)
      if (mouseDownState.isMouseDown) {
        console.log('👆 Simple click (no drag) detected, clearing mouse down state');
        setMouseDownState({
          isMouseDown: false,
          startX: 0,
          startY: 0,
          startTime: 0,
          clipId: null,
          dragType: null,
        });
        return;
      }

      if (
        dragState.isDragging &&
        dragState.selectedClipIds.length > 0 &&
        !dragState.isValidDrop
      ) {
        // Revert to original position if drop is invalid - PRESERVE SELECTION STATE
        setTimelineState((prev) => ({
          ...prev,
          tracks: prev.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => {
              if (!dragState.selectedClipIds.includes(clip.id))
                return clip;

              const originalClip = dragState.originalClips.find(
                (c) => c.id === clip.id,
              );
              if (!originalClip) return clip;

              return {
                ...clip,
                trackId: originalClip.trackId,
                startTime: originalClip.startTime,
                endTime: originalClip.endTime,
                duration: originalClip.duration,
                selected: true, // Preserve selection state
                waveformData: clip.waveformData,
                waveformColor: clip.waveformColor,
              };
            }),
          })),
        }));
      }

      // Handle trim operations - create audio segments for trimmed clips
      if (dragState.isDragging && (dragState.dragType === "trim-start" || dragState.dragType === "trim-end")) {
        const clipId = dragState.clipId;
        if (clipId) {
          console.log(`✂️ Finalizing trim operation for ${clipId}`);
          
          // Find the current clip state after trim
          const allClips = timelineState.tracks.flatMap(track => track.clips);
          const trimmedClip = allClips.find(c => c.id === clipId);
          
          if (trimmedClip) {
            // Find the corresponding audio track
            const audioTrack = audioTracks.find(track => 
              track.name === trimmedClip.name || track.file.name.includes(trimmedClip.name)
            );
            
            if (audioTrack && audioTrack.channelData) {
              console.log(`   🎵 Creating audio segment for trimmed clip: duration=${trimmedClip.duration.toFixed(2)}s, sourceOffset=${trimmedClip.sourceStartOffset.toFixed(2)}s`);
              
              // Create audio segment based on the new clip properties
              const sampleRate = audioTrack.sampleRate;
              const startSample = Math.floor(trimmedClip.sourceStartOffset * sampleRate);
              const endSample = Math.floor((trimmedClip.sourceStartOffset + trimmedClip.duration) * sampleRate);
              const segmentData = audioTrack.channelData.slice(startSample, endSample);
              
              // Update audio tracks with the new segment
              setAudioTracks(prev => prev.map(track => {
                if (track.name === trimmedClip.name || track.file.name.includes(trimmedClip.name)) {
                  // Remove old segments for this clip
                  const filteredSegments = (track.segments || []).filter((seg: AudioTrackSegment) => seg.clipId !== trimmedClip.id);
                  
                  return {
                    ...track,
                    segments: [
                      ...filteredSegments,
                      {
                        clipId: trimmedClip.id,
                        startTime: trimmedClip.startTime,
                        duration: trimmedClip.duration,
                        audioData: segmentData
                      }
                    ]
                  };
                }
                return track;
              }));
              
              // Update the waveform data to match the trimmed audio
              const newWaveform = generateWaveformFromAudio(segmentData, sampleRate);
              setTimelineState(prev => ({
                ...prev,
                tracks: prev.tracks.map(track => ({
                  ...track,
                  clips: track.clips.map(clip => 
                    clip.id === clipId ? { ...clip, waveformData: newWaveform } : clip
                  )
                }))
              }));
              
              console.log(`   ✅ Audio segment created: ${segmentData.length} samples (${(segmentData.length / sampleRate).toFixed(2)}s)`);
            }
          }
        }
      }

      // Handle new track creation when dropping in new track zone
      if (dragState.isDragging && dragState.dragType === "move" && dragState.targetTrackId === 'NEW_TRACK' && dragState.isValidDrop) {
        console.log('➕ Creating new track for dropped clips');
        
        setTimelineState((prev) => {
          const newTrack = createNewTrack();
          
          // Move all selected clips to the new track
          const updatedTracks = prev.tracks.map((track) => ({
            ...track,
            clips: track.clips.filter(clip => !dragState.selectedClipIds.includes(clip.id))
          }));
          
          // Add new track with the dropped clips
          const clipsForNewTrack = prev.tracks
            .flatMap(track => track.clips)
            .filter(clip => dragState.selectedClipIds.includes(clip.id))
            .map(clip => ({ ...clip, trackId: newTrack.id }));
          
          newTrack.clips = clipsForNewTrack;
          updatedTracks.push(newTrack);
          
          console.log(`✅ Created new track ${newTrack.id} with ${clipsForNewTrack.length} clips`);
          return {
            ...prev,
            tracks: updatedTracks
          };
        });
      }

      // Handle auto-track switching after successful move operations
      else if (dragState.isDragging && dragState.dragType === "move" && dragState.isValidDrop) {
        console.log('🔄 Checking for auto-track switching after successful drop');
        
        setTimelineState((prev) => {
          const clipsToMove: Array<{ clip: any; fromTrackId: string; toTrackId: string; }> = [];
          const newTracksNeeded: Array<{ trackId: string; track: TimelineTrack; }> = [];
          
          // First pass: identify clips that need to be moved
          prev.tracks.forEach((track) => {
            track.clips.forEach((clip) => {
              // Skip selected clips - they were moved intentionally
              if (dragState.selectedClipIds.includes(clip.id)) return;
              
              // Check if this non-selected clip is now colliding with any other clips
              const hasCollision = prev.tracks
                .flatMap(t => t.clips)
                .some(otherClip => 
                  otherClip.id !== clip.id && // Don't check against itself
                  otherClip.trackId === track.id && // Same track
                  !(clip.endTime <= otherClip.startTime || clip.startTime >= otherClip.endTime) // Time overlap
                );
              
                              if (hasCollision) {
                console.log(`🔄 Non-selected clip ${clip.id} is colliding, finding available track`);
                
                // Find an available track for this clip
                const availableTrackId = findAvailableTrack(
                  clip.id,
                  clip.startTime,
                  clip.endTime,
                  [track.id]
                );
                
                if (availableTrackId === 'CREATE_NEW_TRACK') {
                  // Create a new track
                  const newTrack = createNewTrack();
                  newTracksNeeded.push({ trackId: newTrack.id, track: newTrack });
                  
                  clipsToMove.push({
                    clip: { ...clip, trackId: newTrack.id },
                    fromTrackId: track.id,
                    toTrackId: newTrack.id
                  });
                  console.log(`   ✅ Will create new track ${newTrack.id} and move clip ${clip.id} there`);
                } else if (availableTrackId) {
                  clipsToMove.push({
                    clip: { ...clip, trackId: availableTrackId },
                    fromTrackId: track.id,
                    toTrackId: availableTrackId
                  });
                  console.log(`   ✅ Will move clip ${clip.id} from ${track.id} to ${availableTrackId}`);
                }
              }
            });
          });
          
          if (clipsToMove.length === 0) return prev;
          
          // Second pass: create new tracks and update existing ones
          let updatedTracks = [
            ...prev.tracks.map((track) => ({
              ...track,
              clips: [
                // Keep clips that aren't being moved
                ...track.clips.filter(clip => 
                  !clipsToMove.some(move => move.clip.id === clip.id)
                ),
                // Add clips being moved to this track
                ...clipsToMove
                  .filter(move => move.toTrackId === track.id)
                  .map(move => move.clip)
              ]
            })),
            // Add new tracks with their clips
            ...newTracksNeeded.map(({ track, trackId }) => ({
              ...track,
              clips: clipsToMove
                .filter(move => move.toTrackId === trackId)
                .map(move => move.clip)
            }))
          ];
          
          console.log(`✅ Auto-track switching completed - moved ${clipsToMove.length} clips, created ${newTracksNeeded.length} new tracks`);
          return {
            ...prev,
            tracks: updatedTracks
          };
        });
      }

      // Clean up empty tracks after any successful drop operation
      if (dragState.isDragging && dragState.dragType === "move" && dragState.isValidDrop) {
        setTimeout(() => {
          removeEmptyTracks();
        }, 100); // Small delay to let other state updates complete
      }

      // Recalculate timeline duration only after successful operations
      if (dragState.isDragging) {
        const shouldRecalculate = 
          // Valid move/drop operations
          (dragState.dragType === "move" && dragState.isValidDrop) ||
          // Completed trim operations
          (dragState.dragType === "trim-start" || dragState.dragType === "trim-end");
          
        if (shouldRecalculate) {
          console.log('📏 Recalculating timeline duration after completed operation');
          setTimelineState(prev => {
            const newDuration = calculateTimelineDuration(prev.tracks);
            return {
              ...prev,
              totalDuration: newDuration,
            };
          });
        }
      }

      // Reset drag and snap states
      setDragState({
        isDragging: false,
        dragType: null,
        clipId: null,
        selectedClipIds: [],
        startX: 0,
        startY: 0,
        startTime: 0,
        originalClips: [],
        targetTrackId: null,
        trackOffsets: new Map(),
        isValidDrop: false,
        collisionDetected: false,
        dragStarted: false,
        showNewTrackIndicator: false,
      });

      setSnapState({
        isSnapping: false,
        snapPosition: null,
        snapType: null,
        targetClipId: null,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove,
      );
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    mouseDownState,
    timelineState.tracks,
    timelineState.selectedClips,
    pixelToTime,
    findSnapPoints,
    getTrackAtY,
    checkCollision,
    getClipsInGroup,
    handleAutoTrackSwitch,
    findAvailableTrack,
    createNewTrack,
    removeEmptyTracks,
    isAboveNewTrackZone,
  ]);

  // Handle range selection for split/delete operations
  const handleRangeSelect = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    setRangeSelection({ clipId, startOffset, endOffset });
    
    // Check if this is a group range selection
    const group = timelineState.groups.find(g => g.id === clipId);
    
    if (group) {
      // For group range selections, keep the group selected
      console.log(`📍 Group range selection: keeping group ${group.name} selected`);
      
      // Ensure the group remains selected
      setTimelineState((prev) => ({
        ...prev,
        selectedClips: group.clipIds, // Keep group clips selected
        tracks: prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            ...clip,
            selected: group.clipIds.includes(clip.id), // Keep group clips selected
          })),
        })),
      }));
    } else {
      // For individual clip range selections, only keep that clip selected
      console.log(`📍 Individual clip range selection: selecting only clip ${clipId}`);
      
      setTimelineState((prev) => ({
        ...prev,
        selectedClips: [clipId], // Keep only the ranged clip selected
        tracks: prev.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            ...clip,
            selected: clip.id === clipId, // Select only the ranged clip
          })),
        })),
      }));
    }
  }, [timelineState.groups]);

  // Clear range selection
  const clearRangeSelection = useCallback(() => {
    setRangeSelection(null);
    console.log('🔄 Range selection cleared');
  }, []);

  // Enhanced keyboard shortcuts that work with range selections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when no input field is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (rangeSelection) {
          console.log(`🗑️ Keyboard delete range: ${rangeSelection.clipId}`);
          handleRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
          setRangeSelection(null);
        } else if (timelineState.selectedClips.length > 0) {
          handleDelete();
        }
      } else if ((event.key === 's' || event.key === 'S') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (rangeSelection) {
          console.log(`✂️ Keyboard split range: ${rangeSelection.clipId}`);
          handleRangeSplit(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
          setRangeSelection(null);
        } else if (timelineState.selectedClips.length > 0) {
          handleSplit();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (rangeSelection) {
          clearRangeSelection();
        } else {
          // Clear clip selection
          setTimelineState(prev => ({
            ...prev,
            selectedClips: []
          }));
        }
      } else if (event.key === ' ') {
        event.preventDefault();
        handlePlayPause();
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        handleZoomOut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rangeSelection, timelineState.selectedClips, handleRangeDelete, handleRangeSplit, handleDelete, handleSplit, handlePlayPause, clearRangeSelection]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0e0e0e] flex flex-col select-none"
    >
      {/* Action Bar */}
      <InteractiveControls
        onSplit={handleSplit}
        onDelete={handleDelete}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onPlayPause={handlePlayPause}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomSlider={handleZoomSlider}
        playheadPosition={timelineState.playheadPosition}
        totalDuration={timelineState.totalDuration}
        isPlaying={timelineState.isPlaying}
        selectedClips={timelineState.selectedClips}
        zoomLevel={timelineState.zoomLevel}
        hasGroupedSelection={hasGroupedSelection()}
        timelineState={timelineState}
        rangeSelection={rangeSelection}
        onRangeSplit={handleRangeSplit}
        onRangeDelete={handleRangeDelete}
        onClearRangeSelection={clearRangeSelection}
      />

      {/* Timeline Ruler */}
      <div
        className="relative cursor-pointer"
        onClick={handleTimelineClick}
      >
        <TimelineRuler
          timeToPixel={timeToPixel}
          totalDuration={timelineState.totalDuration}
          zoomLevel={timelineState.zoomLevel}
        />
      </div>

      {/* Playhead */}
      <div
        className="absolute top-[28px] bottom-0 w-0.5 bg-white cursor-col-resize z-20"
        style={{
          left: `${40 + timeToPixel(timelineState.playheadPosition)}px`,
        }}
        onMouseDown={handlePlayheadDragStart}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full cursor-col-resize shadow-md" />
      </div>

      {/* Snap Indicator */}
      <SnapIndicator
        timeToPixel={timeToPixel}
        snapState={snapState}
      />

      {/* Track Area with Background Click Handler */}
      <div
        ref={trackAreaRef}
        className="flex-1 bg-[#0e0e0e] overflow-hidden select-none"
        onClick={handleBackgroundClick}
      >
        <div className="pl-[40px] pr-4 py-2">
          {/* First, render expanded groups separately (they need more height) */}
          {timelineState.groups.filter(group => !group.collapsed).map(group => {
            // Get all clips in this group
            const groupClips = timelineState.tracks
              .flatMap(t => t.clips)
              .filter(clip => clip.groupId === group.id);
            
            if (groupClips.length === 0) return null;
            
            // Check if group is selected
            const isGroupSelected = group.clipIds.every(clipId =>
              timelineState.selectedClips.includes(clipId)
            );

            return (
              <GroupTrackRow
                key={`expanded-group-${group.id}`}
                group={group}
                clips={groupClips}
                onGroupClick={handleGroupClick}
                onGroupMouseDown={handleGroupMouseDown}
                onExpandGroup={handleExpandGroup}
                onCollapseGroup={handleCollapseGroup}
                onClipClick={handleClipClick}
                onClipMouseDown={handleClipMouseDown}
                timeToPixel={timeToPixel}
                zoomLevel={timelineState.zoomLevel}
                snapState={snapState}
                dragState={dragState}
                selected={isGroupSelected}
                rangeSelection={rangeSelection}
                onRangeSelect={handleRangeSelect}
                onRangeSplit={handleRangeSplit}
                onRangeDelete={handleRangeDelete}
              />
            );
          })}

          {/* Then, render tracks with embedded collapsed groups */}
          {timelineState.tracks.map((track, trackIndex) => {
            // Get all clips for this track (including grouped ones)
            const trackClips = timelineState.tracks
              .flatMap((t) => t.clips)
              .filter((c) => c.trackId === track.id);

            // Skip rendering if no clips in this track
            if (trackClips.length === 0) return null;

            // Check if this track is a drop target for any of the dragged clips
            let isDropTarget = false;
            let isValidDropTarget = false;

            if (
              dragState.isDragging &&
              dragState.dragType === "move"
            ) {
              const primaryTargetTrackIndex = getTrackIndex(
                dragState.targetTrackId || "",
              );

              // Check if any clip would land on this track
              dragState.originalClips.forEach((clip) => {
                const trackOffset =
                  dragState.trackOffsets.get(clip.id) || 0;
                const targetTrackIndex =
                  primaryTargetTrackIndex + trackOffset;

                if (
                  targetTrackIndex === trackIndex &&
                  clip.trackId !== track.id
                ) {
                  isDropTarget = true;
                  isValidDropTarget = dragState.isValidDrop;
                }
              });
            }

            return (
              <TrackRow
                key={track.id}
                track={track}
                clips={trackClips}
                onClipClick={handleClipClick}
                onClipMouseDown={handleClipMouseDown}
                timeToPixel={timeToPixel}
                zoomLevel={timelineState.zoomLevel}
                snapState={snapState}
                dragState={dragState}
                isDropTarget={isDropTarget}
                isValidDropTarget={isValidDropTarget}
                groups={timelineState.groups}
                rangeSelection={rangeSelection}
                onRangeSelect={handleRangeSelect}
                onRangeSplit={handleRangeSplit}
                onRangeDelete={handleRangeDelete}
                onGroupClick={handleGroupClick}
                onGroupMouseDown={handleGroupMouseDown}
                onExpandGroup={handleExpandGroup}
                onCollapseGroup={handleCollapseGroup}
              />
            );
          })}
          
          {/* New Track Drop Zone Indicator */}
          {dragState.showNewTrackIndicator && (
            <div className="h-16 mt-2 mb-2 border-2 border-dashed border-[#E961FF] border-opacity-60 rounded-lg bg-[#E961FF] bg-opacity-10 flex items-center justify-center transition-all duration-200">
              <div className="text-[#E961FF] text-sm font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1V15M1 8H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Drop here to create new track
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Track Button - Bottom of Timeline */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="relative">
          <input
            type="file"
            accept="audio/*,.wav,.raw,.pcm"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="audio-file-input"
          />
          <label
            htmlFor="audio-file-input"
            className="flex items-center gap-2 px-4 py-2 bg-[#E961FF] hover:bg-[#d854e6] text-white text-sm font-medium rounded-lg cursor-pointer transition-colors duration-200 shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1V15M1 8H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add Track
          </label>
        </div>
      </div>
    </div>
  );
}