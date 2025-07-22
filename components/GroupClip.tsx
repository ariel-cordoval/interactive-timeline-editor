import React, { useState, useRef, useCallback, useEffect } from 'react';

interface TimelineClip {
  id: string;
  name: string;
  trackId: string;
  startTime: number;
  endTime: number;
  duration: number;
  selected: boolean;
  waveformData?: number[];
  waveformColor?: string;
  groupId?: string;
  sourceStartOffset: number;
}

interface TimelineGroup {
  id: string;
  name: string;
  clipIds: string[];
  collapsed: boolean;
  trackId: string; // Groups now have a trackId like clips
}

interface GroupClipProps {
  group: TimelineGroup;
  clips: TimelineClip[];
  duration: number;
  startTime: number;
  width: number;
  selected?: boolean;
  onGroupSelect?: (groupId: string, event: React.MouseEvent) => void;
  onRangeSelect?: (groupId: string, startOffset: number, endOffset: number) => void;
  onGroupSplit?: (groupId: string, splitPoint: number) => void;
  onGroupDelete?: (groupId: string) => void;
  onGroupMouseDown?: (event: React.MouseEvent) => void;
  onExpandGroup?: (groupId: string) => void;
  onCollapseGroup?: (groupId: string) => void;
}

export default function GroupClip({
  group,
  clips,
  duration,
  startTime,
  width,
  selected = false,
  onGroupSelect,
  onRangeSelect,
  onGroupSplit,
  onGroupDelete,
  onGroupMouseDown,
  onExpandGroup,
  onCollapseGroup,
}: GroupClipProps) {
  // Range selection state (like TimelineClip)
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate consistent colors for speakers
  const getSpeakerColor = useCallback((clipName: string, clipColor?: string) => {
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
  }, []);

  // Generate real combined waveform with speaker color coding
  const generateCombinedWaveform = useCallback(() => {
    if (!clips.length) return [];
    
    const bars = [];
    const barCount = Math.max(20, Math.floor(width / 3)); // More bars for better resolution
    const segmentDuration = duration / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const segmentTime = i * segmentDuration;
      
      // Find which clips are active at this time and their contributions
      const activeClips = clips.filter(clip => {
        const relativeClipStart = clip.startTime - startTime;
        const relativeClipEnd = clip.endTime - startTime;
        return segmentTime >= relativeClipStart && segmentTime < relativeClipEnd;
      });
      
      // Calculate individual amplitudes and find dominant speaker
      const clipAmplitudes: Array<{
        clip: TimelineClip;
        amplitude: number;
        color: string;
      }> = [];
      
      activeClips.forEach(clip => {
        if (clip.waveformData && clip.waveformData.length > 0) {
          const clipProgress = (segmentTime - (clip.startTime - startTime)) / clip.duration;
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
          x: (i / barCount) * width,
          height: barHeight,
          opacity,
          color: dominantSpeaker.color,
          speakers: clipAmplitudes.map(ca => ca.clip.name || 'Unknown').join(', '),
          dominantSpeaker: dominantSpeaker.clip.name || 'Unknown'
        });
      } else {
        // No active clips - show minimal bar
        bars.push({
          x: (i / barCount) * width,
          height: 2,
          opacity: 0.2,
          color: '#666666',
          speakers: '',
          dominantSpeaker: ''
        });
      }
    }
    
    return bars;
  }, [clips, duration, startTime, width, getSpeakerColor]);

  const waveformBars = generateCombinedWaveform();

  // Handle content area interaction (range selection)
  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    if (!contentRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = contentRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startOffset = (startX / rect.width) * duration;
    const mouseDownTime = Date.now();
    const mouseDownX = e.clientX;
    const mouseDownY = e.clientY;
    
    setIsSelecting(true);
    setSelectionStart(startOffset);
    setSelectionEnd(startOffset);
    
    let hasMoved = false;
    let currentSelectionStart = startOffset;  // Track locally to avoid React state timing issues
    let currentSelectionEnd = startOffset;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.stopPropagation();
      if (!contentRef.current) return;
      
      // Check if this is actually a drag (moved more than 3 pixels)
      const deltaX = Math.abs(e.clientX - mouseDownX);
      const deltaY = Math.abs(e.clientY - mouseDownY);
      
      if (deltaX > 3 || deltaY > 3) {
        hasMoved = true;
        
        // Continue with range selection
        const rect = contentRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentOffset = Math.max(0, Math.min(duration, (currentX / rect.width) * duration));
        currentSelectionEnd = currentOffset;  // Update local variable
        setSelectionEnd(currentOffset);  // Also update React state for visual feedback
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      setIsSelecting(false);
      const timeDelta = Date.now() - mouseDownTime;
      
      // If this was a simple click (no movement and quick), just clear any partial selection
      if (!hasMoved && timeDelta < 300) {
        // Clear any existing selection but don't trigger group selection
        // Let the background click handler deal with selection/deselection
        setSelectionStart(null);
        setSelectionEnd(null);
      } else if (hasMoved) {
        // Use local variables instead of React state to avoid timing issues
        const start = Math.min(currentSelectionStart, currentSelectionEnd);
        const end = Math.max(currentSelectionStart, currentSelectionEnd);
        
        // Only trigger range select if there's a meaningful selection (> 0.1 seconds)
        if (Math.abs(end - start) > 0.1) {
          onRangeSelect?.(group.id, start, end);
        } else {
          // Clear selection if it's too small
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [duration, group.id, onRangeSelect]);

  // Handle header click
  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    // Don't handle if clicking expand/collapse button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.stopPropagation();
    onGroupSelect?.(group.id, e);
  }, [group.id, onGroupSelect]);

  // Handle group selection (similar to TimelineClip)
  const handleGroupClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks that aren't from the content area to avoid conflicts
    if (contentRef.current && contentRef.current.contains(e.target as Node)) {
      return;
    }
    
    onGroupSelect?.(group.id, e);
  }, [group.id, onGroupSelect]);

  // Handle header drag
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    onGroupMouseDown?.(e);
  }, [onGroupMouseDown]);

  // Clear selection when deselected
  useEffect(() => {
    if (!selected) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [selected]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectionStart !== null && selectionEnd !== null) {
          // Delete selected range
          clearSelection();
          // TODO: Implement actual range deletion in the timeline
        } else {
          // Delete entire group
          onGroupDelete?.(group.id);
        }
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectionStart !== null && selectionEnd !== null) {
          const splitPoint = (selectionStart + selectionEnd) / 2;
          onGroupSplit?.(group.id, splitPoint);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
    };

    if (selected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selected, group.id, selectionStart, selectionEnd, onGroupDelete, onGroupSplit, clearSelection]);

  if (group.collapsed) {
    // Collapsed state - behaves like a single clip
    return (
      <div
        className={`
          relative rounded-lg overflow-hidden transition-all duration-200 h-16
          ${selected ? 'ring-2 ring-[#E961FF] ring-opacity-50' : ''}
        `}
        style={{ width: `${width}px` }}
        data-group-id={group.id}
      >
        {/* Header Area - Draggable */}
        <div
          className={`
            relative bg-[#2b2b2b] cursor-grab active:cursor-grabbing
            hover:bg-[#333333] transition-colors duration-150 h-6
          `}
          onMouseDown={handleHeaderMouseDown}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            {/* Expand Arrow */}
            <div className="w-4 h-4 rounded-sm bg-[#E961FF] bg-opacity-20 shrink-0 flex items-center justify-center">
              <button
                className="w-3 h-3 flex items-center justify-center rotate-[270deg] hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onExpandGroup?.(group.id);
                }}
                title="Expand group"
              >
                <svg className="w-2.5 h-2.5 text-[#E961FF]" viewBox="0 0 16 16" fill="none">
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
            
            {/* Group Name */}
            <div className="flex-1 min-w-0">
              <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
                {group.name || 'Tracks group'}
              </p>
            </div>
            
            {/* Duration */}
            <div className="text-[#888888] text-[10px] shrink-0">
              {Math.floor(duration)}s
            </div>
          </div>
        </div>

        {/* Content Area - Waveform & Selection */}
        <div
          ref={contentRef}
          className={`
            relative h-10 cursor-crosshair overflow-hidden transition-colors duration-150
            bg-[#1d1d1d] hover:bg-[#222222]
            ${isSelecting ? 'cursor-grabbing bg-[#252525]' : ''}
            ${selected ? 'ring-1 ring-[#E961FF] ring-opacity-30' : ''}
            z-30 pointer-events-auto mx-1
          `}
          onMouseDown={handleContentMouseDown}
          onClick={handleGroupClick}
          title={`Real combined waveform • Colors show active speakers${clips.length > 1 ? ` (${clips.length} tracks)` : ''} • Drag vertically to move between tracks • Drag horizontally to move in time • Shift+drag to select range`}
        >
          {/* Waveform */}
          <div className="flex items-center h-full px-1 py-1">
            <div className="h-full relative w-full">
              <svg className="w-full h-full" viewBox={`0 0 ${width} 32`} preserveAspectRatio="none">
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

          {/* Active Speaker Indicator */}
          {(() => {
            // Find the currently most active speaker based on the latest waveform data
            const recentBars = waveformBars.slice(-5); // Last 5 bars
            const activeSpeakers = recentBars
              .filter((bar: any) => bar.dominantSpeaker && bar.opacity > 0.5)
              .map((bar: any) => ({ name: bar.dominantSpeaker, color: bar.color }));
            
            if (activeSpeakers.length > 0) {
              const currentSpeaker = activeSpeakers[activeSpeakers.length - 1];
              return (
                <div 
                  className="absolute top-1 right-2 px-2 py-0.5 rounded text-xs font-medium shadow-lg border"
                  style={{ 
                    backgroundColor: currentSpeaker.color + '20',
                    borderColor: currentSpeaker.color,
                    color: currentSpeaker.color
                  }}
                >
                  🎤 {currentSpeaker.name}
                </div>
              );
            }
            return null;
          })()}

          {/* Selection Overlay */}
          {selectionStart !== null && selectionEnd !== null && contentRef.current && (
            <div
              className="absolute top-0 bottom-0 bg-[#E961FF] bg-opacity-25 border border-[#E961FF] pointer-events-none transition-all duration-100"
              style={{
                left: `${Math.min(selectionStart, selectionEnd) / duration * 100}%`,
                width: `${Math.abs(selectionEnd - selectionStart) / duration * 100}%`,
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

        {/* Trim Handles */}
        {selected && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" 
              title="Drag to trim from start" 
            />
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" 
              title="Drag to trim from end" 
            />
          </>
        )}
      </div>
    );
  } else {
    // Expanded state - clips stacked vertically in same track
    const clipHeight = 45;
    const headerHeight = 25;
    const totalHeight = headerHeight + (clips.length * clipHeight) + (clips.length - 1) * 2; // 2px spacing between clips
    
    return (
      <div
        className={`
          relative rounded-lg overflow-hidden transition-all duration-200
          ${selected ? 'ring-2 ring-[#E961FF] ring-opacity-50' : ''}
        `}
        style={{ width: `${width}px`, height: `${totalHeight}px` }}
        data-group-id={group.id}
      >
        {/* Expanded Group Header */}
        <div
          className="relative bg-[#2b2b2b] cursor-grab active:cursor-grabbing hover:bg-[#333333] transition-colors duration-150"
          style={{ height: `${headerHeight}px` }}
          onMouseDown={handleHeaderMouseDown}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            {/* Collapse Arrow */}
            <div className="w-4 h-4 rounded-sm bg-[#E961FF] bg-opacity-20 shrink-0 flex items-center justify-center">
              <button
                className="w-3 h-3 flex items-center justify-center hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCollapseGroup?.(group.id);
                }}
                title="Collapse group"
              >
                <svg className="w-2.5 h-2.5 text-[#E961FF]" viewBox="0 0 16 16" fill="none">
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
            
            <div className="flex-1 min-w-0">
              <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
                {group.name || 'Tracks group'} (expanded)
              </p>
            </div>
            
            <div className="text-[#888888] text-[10px] shrink-0">
              {clips.length} clips
            </div>
          </div>
        </div>

        {/* Stacked Clips */}
        <div className="relative" style={{ height: `${totalHeight - headerHeight}px` }}>
          {clips.map((clip, index) => {
            const clipTop = index * (clipHeight + 2); // 2px spacing
            const clipStartOffset = clip.startTime - startTime;
            const clipLeftPercent = (clipStartOffset / duration) * 100;
            const clipWidthPercent = (clip.duration / duration) * 100;
            
            return (
              <div
                key={clip.id}
                className="absolute bg-[#1d1d1d] border border-[#333] rounded overflow-hidden"
                style={{
                  top: `${clipTop}px`,
                  left: `${clipLeftPercent}%`,
                  width: `${clipWidthPercent}%`,
                  height: `${clipHeight}px`,
                }}
              >
                {/* Mini clip header */}
                <div className="bg-[#2a2a2a] px-2 py-1 text-[10px] text-[#aaa] truncate">
                  {clip.name}
                </div>
                
                {/* Mini waveform */}
                <div className="h-6 px-1 flex items-center">
                  {clip.waveformData && (
                    <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                      {clip.waveformData.slice(0, 20).map((amplitude, i) => (
                        <rect
                          key={i}
                          x={i * 5}
                          y={(20 - amplitude * 16) / 2}
                          width="3"
                          height={amplitude * 16}
                          fill={clip.waveformColor || '#E961FF'}
                          opacity="0.8"
                        />
                      ))}
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Group Trim Handles */}
        {selected && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity z-20" 
              title="Drag to trim group from start" 
            />
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity z-20" 
              title="Drag to trim group from end" 
            />
          </>
        )}
      </div>
    );
  }
} 