import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

interface WaveformSegment {
  id: string;
  width: number;
  height: number;
  offset: number;
}

interface TimelineClipProps {
  id: string;
  fileName: string;
  duration: number; // in seconds
  startTime: number; // position on timeline
  width: number; // clip width in pixels
  thumbnail?: string;
  waveformData?: WaveformSegment[] | Float32Array; // Support both old and new format
  waveformColor?: string; // Color for the waveform
  selected?: boolean;
  onClipDrag?: (clipId: string, newPosition: number) => void;
  onClipSelect?: (clipId: string, event: React.MouseEvent) => void;
  onRangeSelect?: (clipId: string, startOffset: number, endOffset: number) => void;
  onClipSplit?: (clipId: string, splitPoint: number) => void;
  onClipDelete?: (clipId: string) => void;
  onClipMouseDown?: (event: React.MouseEvent) => void;
}

// Seeded random function for consistent waveform generation
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Simple LCG (Linear Congruential Generator)
  let current = Math.abs(hash);
  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

// Mock waveform data generator with consistent output
const generateMockWaveformData = (clipId: string, segments: number = 12): WaveformSegment[] => {
  const random = seededRandom(clipId);
  const segmentWidths = [205, 103, 104, 125, 81, 104, 125, 103, 104, 125, 104];
  
  return Array.from({ length: segments }, (_, i) => ({
    id: `segment-${i}`,
    width: segmentWidths[i % segmentWidths.length] || 100,
    height: random() * 0.8 + 0.2, // Seeded random height between 0.2 and 1.0
    offset: 0,
  }));
};

export default function TimelineClip({
  id,
  fileName,
  duration,
  startTime,
  width,
  thumbnail: _thumbnail, // Unused for now
  waveformData,
  waveformColor = '#E961FF',
  selected = false,
  onClipDrag,
  onClipSelect,
  onRangeSelect,
  onClipSplit,
  onClipDelete,
  onClipMouseDown,
}: TimelineClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialPosition, setInitialPosition] = useState(startTime);
  
  const clipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate stable waveform data using clip ID as seed or real audio data
  const stableWaveformData = useMemo(() => {
    // If waveformData is Float32Array (real audio data), use it directly
    if (waveformData instanceof Float32Array) {
      return waveformData;
    }
    // Otherwise, fall back to legacy segment-based data or generate mock data
    return waveformData || generateMockWaveformData(id);
  }, [waveformData, id]);

  // Generate waveform bars - handle both real audio data and mock data
  const waveformBars = useMemo(() => {
    if (stableWaveformData instanceof Float32Array) {
      // Real audio data - convert to bar heights
      const maxValue = Math.max(...Array.from(stableWaveformData));
      // const barWidth = Math.max(2, width / stableWaveformData.length);
      const barsPerWidth = Math.floor(width / 3);
      const samplesPerBar = Math.floor(stableWaveformData.length / barsPerWidth);
      
      return Array.from({ length: barsPerWidth }, (_, i) => {
        const startSample = i * samplesPerBar;
        const endSample = Math.min(startSample + samplesPerBar, stableWaveformData.length);
        
        // Calculate RMS for this bar segment
        let sum = 0;
        for (let j = startSample; j < endSample; j++) {
          sum += stableWaveformData[j] * stableWaveformData[j];
        }
        const rms = Math.sqrt(sum / (endSample - startSample));
        const normalizedHeight = maxValue > 0 ? (rms / maxValue) : 0;
        
        return {
          barHeight: Math.max(2, normalizedHeight * 28),
          x: i * 3,
          opacity: 0.9,
        };
      });
    } else {
      // Legacy mock data format
      const random = seededRandom(`${id}-bars`);
      return stableWaveformData.map((segment) => {
        const barCount = Math.floor(segment.width / 3);
        return Array.from({ length: barCount }, (_, i) => ({
          barHeight: random() * 28 + 2,
          x: i * 3,
          opacity: 0.8 + random() * 0.2,
        }));
      }).flat();
    }
  }, [stableWaveformData, id, width]);

  // Handle clip dragging from header - delegate to main timeline system
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use the main timeline's drag system instead of our own
    if (onClipMouseDown) {
      onClipMouseDown(e);
    } else {
      // Fallback to old system if onClipMouseDown not provided
      setIsDragging(true);
      setDragStartX(e.clientX);
      setInitialPosition(startTime);
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - dragStartX;
        const newPosition = Math.max(0, initialPosition + deltaX / 10); // Scale factor for timeline
        onClipDrag?.(id, newPosition);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [onClipMouseDown, isDragging, dragStartX, initialPosition, startTime, id, onClipDrag]);

  // Handle content area selection
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
        // Clear any existing selection but don't trigger clip selection
        // Let the background click handler deal with selection/deselection
        setSelectionStart(null);
        setSelectionEnd(null);
      } else if (hasMoved) {
        // Use local variables instead of React state to avoid timing issues
        const start = Math.min(currentSelectionStart, currentSelectionEnd);
        const end = Math.max(currentSelectionStart, currentSelectionEnd);
        
        // Only trigger range select if there's a meaningful selection (> 0.1 seconds)
        if (Math.abs(end - start) > 0.1) {
          onRangeSelect?.(id, start, end);
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
  }, [duration, id, onRangeSelect, onClipSelect, selectionStart, selectionEnd]);

  // Handle clip selection
  const handleClipClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks that aren't from the content area to avoid conflicts
    if (contentRef.current && contentRef.current.contains(e.target as Node)) {
      return;
    }
    
    onClipSelect?.(id, e);
  }, [id, onClipSelect]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectionStart !== null && selectionEnd !== null) {
          // If there's a selection, delete the selected range
          const start = Math.min(selectionStart, selectionEnd);
          const end = Math.max(selectionStart, selectionEnd);
          console.log(`🗑️ Delete selected range: ${start.toFixed(2)}s - ${end.toFixed(2)}s`);
          clearSelection();
          // TODO: Implement actual range deletion in the timeline
        } else {
          // Delete entire clip
          console.log(`🗑️ Delete entire clip: ${fileName}`);
          onClipDelete?.(id);
        }
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Split at middle of selection or clip center
        const splitPoint = selectionStart && selectionEnd 
          ? (selectionStart + selectionEnd) / 2 
          : duration / 2;
        console.log(`✂️ Split clip at ${splitPoint.toFixed(2)}s`);
        onClipSplit?.(id, splitPoint);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Clear selection on Escape
        console.log('🔄 Clear selection');
        clearSelection();
      }
    };

    if (selected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selected, id, onClipDelete, onClipSplit, selectionStart, selectionEnd, duration, clearSelection]);



  return (
    <div
      ref={clipRef}
      className={`
        relative rounded-lg overflow-hidden transition-all duration-200
        ${selected ? 'ring-2 ring-[#E961FF] ring-opacity-50' : ''}
        ${isDragging ? 'opacity-80 scale-[0.98]' : ''}
      `}
      style={{ width: `${width}px` }}
      onClick={handleClipClick}
      data-clip-id={id}
    >
      {/* Header Area - Draggable */}
      <div
        className={`
          relative bg-[#2b2b2b] cursor-grab active:cursor-grabbing
          hover:bg-[#333333] transition-colors duration-150
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2 px-2 py-1">
          {/* Audio Icon */}
          <div className="w-4 h-4 rounded-sm bg-[#E961FF] bg-opacity-20 shrink-0 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#E961FF]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5z"/>
            </svg>
          </div>
          
          {/* File Name */}
          <div className="flex-1 min-w-0">
            <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
              {fileName}
            </p>
          </div>
          
          {/* Duration indicator */}
          <div className="text-[#888888] text-[10px] shrink-0">
            {Math.floor(duration)}s
          </div>
        </div>
      </div>

      {/* Content Area - Waveform & Selection */}
      <div
        ref={contentRef}
        className={`
          relative h-10 cursor-crosshair overflow-hidden
          transition-colors duration-150
          bg-[#1d1d1d] hover:bg-[#222222]
          ${isSelecting ? 'cursor-grabbing bg-[#252525]' : ''}
          ${selected ? 'ring-1 ring-[#E961FF] ring-opacity-30' : ''}
          z-30 pointer-events-auto mx-1
        `}
        onMouseDown={handleContentMouseDown}
        title="Click and drag to select audio range"
      >
        {/* Waveform Visualization */}
        <div className="flex items-center h-full px-1 py-1">
          {stableWaveformData instanceof Float32Array ? (
            // Real audio data visualization
            <div className="h-full relative w-full">
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${width} 32`}
                preserveAspectRatio="none"
              >
                {waveformBars.map((bar, barIndex) => {
                  const barY = (32 - bar.barHeight) / 2;
                  return (
                    <rect
                      key={barIndex}
                      x={bar.x}
                      y={barY}
                      width="2"
                      height={bar.barHeight}
                      fill={waveformColor}
                      opacity={bar.opacity}
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            // Legacy segment-based visualization
            stableWaveformData.map((segment, segmentIndex) => (
              <div
                key={segment.id}
                className="h-full relative"
                style={{ width: `${segment.width}px` }}
              >
                <svg
                  className="w-full h-full"
                  viewBox={`0 0 ${segment.width} 32`}
                  preserveAspectRatio="none"
                >
                  {/* Render waveform bars */}
                  {waveformBars.filter((_, i) => Math.floor(i * segment.width / width) === segmentIndex).map((bar, barIndex) => {
                    const barY = (32 - bar.barHeight) / 2;
                    return (
                      <rect
                        key={barIndex}
                        x={bar.x}
                        y={barY}
                        width="2"
                        height={bar.barHeight}
                        fill={waveformColor}
                        opacity={bar.opacity}
                      />
                    );
                  })}
                </svg>
              </div>
            ))
          )}
        </div>

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
      
      {/* Resize handles for trimming */}
      {selected && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" />
          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-[#E961FF] opacity-0 hover:opacity-50 transition-opacity" />
        </>
      )}
    </div>
  );
} 