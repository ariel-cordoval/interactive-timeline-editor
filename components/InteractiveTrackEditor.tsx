import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { 
  TimelineClip, 
  TimelineGroup, 
  AudioTrackSegment, 
  TimelineTrack, 
  TimelineState, 
  InteractiveTrackEditorProps,
  DragState,
  SnapState,
  RangeSelection
} from "./types/timeline";
import GroupTrackRow from "./timeline/GroupTrackRow";
import InteractiveControls from "./timeline/InteractiveControls";
import TimelineRuler from "./timeline/TimelineRuler";
import TrackRow from "./timeline/TrackRow";
import SnapIndicator from "./timeline/SnapIndicator";
import { 
  calculateInitialDuration, 
  timeOverlaps, 
  findAvailableTrackForClip,
  calculateSnapPosition,
  generateWaveformData,
  validateTimelineState
} from "./utils/timelineUtils";

export default function InteractiveTrackEditor({
  onTimelineChange,
}: InteractiveTrackEditorProps) {
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  
  // Function to load default audio files (Roni.wav and Ingrid.wav)
  const loadDefaultAudioFiles = useCallback(async () => {
    const defaultFiles = [
      { path: './Roni.wav', trackId: 'track-1', color: '#E961FF' },
      { path: './Ingrid.wav', trackId: 'track-1', color: '#4CAF50' } // Put both on track-1 for grouping
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
        
        // Create AudioContext for processing
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Generate waveform data
        const waveformData = generateWaveformData(audioBuffer);
        
        // Create timeline clip
        const clip: TimelineClip = {
          id: `clip-${Date.now()}-${Math.random()}`,
          trackId: fileInfo.trackId,
          startTime: loadedClips.length * 15, // Stagger clips for demo
          endTime: (loadedClips.length * 15) + audioBuffer.duration,
          duration: audioBuffer.duration,
          type: "audio",
          name: fileInfo.path.split('/').pop()?.replace('.wav', '') || 'Unknown',
          color: fileInfo.color,
          selected: false,
          waveformData,
          waveformColor: fileInfo.color,
          sourceStartOffset: 0,
        };
        
        loadedClips.push(clip);
        
        // Store audio track data
        loadedAudioTracks.push({
          clipId: clip.id,
          audioBuffer,
          audioData: audioBuffer.getChannelData(0), // Use first channel
        });
        
        console.log(`✅ Loaded ${fileInfo.path}: ${audioBuffer.duration.toFixed(2)}s`);
        
      } catch (error) {
        console.error(`❌ Failed to load ${fileInfo.path}:`, error);
      }
    }

    return { clips: loadedClips, audioTracks: loadedAudioTracks };
  }, []);

  // Timeline State
  const [timelineState, setTimelineState] = useState<TimelineState>({
    playheadPosition: 0,
    zoomLevel: 1,
    selectedClips: [],
    tracks: [
      {
        id: "track-1",
        name: "Audio Track 1",
        type: "audio",
        clips: [],
        height: 65,
      },
    ],
    groups: [], // Initialize empty groups
    isPlaying: false,
    totalDuration: 30,
  });

  // Drag state
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

  // Snap state
  const [snapState, setSnapState] = useState<SnapState>({
    isSnapping: false,
    snapPosition: null,
    snapType: null,
    targetClipId: null,
  });

  // Range selection state
  const [rangeSelection, setRangeSelection] = useState<RangeSelection | null>(null);

  // Ref to track container
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  // Initialize tracks with default audio
  useEffect(() => {
    const loadDefaults = async () => {
      console.log('🎬 Initializing timeline with default audio files...');
      const { clips, audioTracks } = await loadDefaultAudioFiles();
      
      if (clips.length > 0) {
        setTimelineState(prev => ({
          ...prev,
          tracks: [
            {
              ...prev.tracks[0],
              clips: clips,
            },
          ],
          totalDuration: calculateInitialDuration([{
            ...prev.tracks[0],
            clips: clips,
          }]),
        }));
        
        setAudioTracks(audioTracks);
        console.log(`🎵 Timeline initialized with ${clips.length} clips`);
      }
    };

    loadDefaults();
  }, [loadDefaultAudioFiles]);

  // Update parent when timeline changes
  useEffect(() => {
    onTimelineChange?.(timelineState);
  }, [timelineState, onTimelineChange]);

  // Validation
  useEffect(() => {
    validateTimelineState(timelineState.tracks);
  }, [timelineState.tracks]);

  // Calculate pixel to time conversion based on zoom
  const timeToPixel = useCallback((time: number) => {
    const basePixelsPerSecond = 20;
    return time * basePixelsPerSecond * timelineState.zoomLevel;
  }, [timelineState.zoomLevel]);

  const pixelToTime = useCallback((pixel: number) => {
    const basePixelsPerSecond = 20;
    return pixel / (basePixelsPerSecond * timelineState.zoomLevel);
  }, [timelineState.zoomLevel]);

  // Get all clips from all tracks for easier processing
  const allClips = timelineState.tracks.flatMap(track => track.clips);

  // Split functionality with range support
  const handleSplit = useCallback(() => {
    if (timelineState.selectedClips.length === 0) {
      // Split all clips at playhead
      console.log(`✂️ Splitting all clips at playhead: ${timelineState.playheadPosition.toFixed(2)}s`);
      
      setTimelineState(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          clips: track.clips.flatMap(clip => {
            if (timelineState.playheadPosition > clip.startTime && 
                timelineState.playheadPosition < clip.endTime) {
              // Split this clip
              const splitPoint = timelineState.playheadPosition;
              const leftDuration = splitPoint - clip.startTime;
              const rightDuration = clip.endTime - splitPoint;
              
              const leftClip: TimelineClip = {
                ...clip,
                id: `${clip.id}-left`,
                endTime: splitPoint,
                duration: leftDuration,
                selected: false,
              };
              
              const rightClip: TimelineClip = {
                ...clip,
                id: `${clip.id}-right`,
                startTime: splitPoint,
                duration: rightDuration,
                sourceStartOffset: clip.sourceStartOffset + leftDuration,
                selected: false,
              };
              
              return [leftClip, rightClip];
            }
            return [clip];
          })
        }))
      }));
    } else {
      // Split selected clips at playhead
      console.log(`✂️ Splitting selected clips at playhead: ${timelineState.playheadPosition.toFixed(2)}s`);
      
      setTimelineState(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          clips: track.clips.flatMap(clip => {
            if (timelineState.selectedClips.includes(clip.id) &&
                timelineState.playheadPosition > clip.startTime && 
                timelineState.playheadPosition < clip.endTime) {
              // Split this selected clip
              const splitPoint = timelineState.playheadPosition;
              const leftDuration = splitPoint - clip.startTime;
              const rightDuration = clip.endTime - splitPoint;
              
              const leftClip: TimelineClip = {
                ...clip,
                id: `${clip.id}-left`,
                endTime: splitPoint,
                duration: leftDuration,
                selected: false,
              };
              
              const rightClip: TimelineClip = {
                ...clip,
                id: `${clip.id}-right`,
                startTime: splitPoint,
                duration: rightDuration,
                sourceStartOffset: clip.sourceStartOffset + leftDuration,
                selected: false,
              };
              
              return [leftClip, rightClip];
            }
            return [clip];
          })
        })),
        selectedClips: [], // Clear selection after split
      }));
    }
  }, [timelineState.playheadPosition, timelineState.selectedClips]);

  // Range-based split functionality
  const handleRangeSplit = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    console.log(`✂️ Range split: ${clipId} from ${startOffset.toFixed(2)}s to ${endOffset.toFixed(2)}s`);
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.flatMap(clip => {
          if (clip.id === clipId) {
            // Create three parts: before, during (removed), after
            const parts: TimelineClip[] = [];
            
            // Before part (if exists)
            if (startOffset > 0) {
              parts.push({
                ...clip,
                id: `${clip.id}-before`,
                endTime: clip.startTime + startOffset,
                duration: startOffset,
                selected: false,
              });
            }
            
            // After part (if exists)
            if (endOffset < clip.duration) {
              parts.push({
                ...clip,
                id: `${clip.id}-after`,
                startTime: clip.startTime + endOffset,
                duration: clip.duration - endOffset,
                sourceStartOffset: clip.sourceStartOffset + endOffset,
                selected: false,
              });
            }
            
            return parts;
          }
          return [clip];
        })
      }))
    }));
    
    // Clear range selection
    setRangeSelection(null);
  }, []);

  // Range-based delete functionality
  const handleRangeDelete = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    console.log(`🗑️ Range delete: ${clipId} from ${startOffset.toFixed(2)}s to ${endOffset.toFixed(2)}s`);
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.flatMap(clip => {
          if (clip.id === clipId) {
            // Create two parts: before and after (removing the middle)
            const parts: TimelineClip[] = [];
            
            // Before part (if exists)
            if (startOffset > 0) {
              parts.push({
                ...clip,
                id: `${clip.id}-before`,
                endTime: clip.startTime + startOffset,
                duration: startOffset,
                selected: false,
              });
            }
            
            // After part (if exists)
            if (endOffset < clip.duration) {
              parts.push({
                ...clip,
                id: `${clip.id}-after`,
                startTime: clip.startTime + endOffset,
                duration: clip.duration - endOffset,
                sourceStartOffset: clip.sourceStartOffset + endOffset,
                selected: false,
              });
            }
            
            return parts;
          }
          return [clip];
        })
      }))
    }));
    
    // Clear range selection
    setRangeSelection(null);
  }, []);

  // Clear range selection
  const handleClearRangeSelection = useCallback(() => {
    setRangeSelection(null);
  }, []);

  // Handle range selection
  const handleRangeSelect = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    setRangeSelection({ clipId, startOffset, endOffset });
    console.log(`📍 Range selected: ${clipId} from ${startOffset.toFixed(2)}s to ${endOffset.toFixed(2)}s`);
  }, []);

  // Delete functionality
  const handleDelete = useCallback(() => {
    console.log(`🗑️ Deleting ${timelineState.selectedClips.length} selected clips`);
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => !timelineState.selectedClips.includes(clip.id))
      })),
      selectedClips: [],
    }));
  }, [timelineState.selectedClips]);

  // Group functionality
  const handleGroup = useCallback(() => {
    if (timelineState.selectedClips.length < 2) return;
    
    const selectedClips = allClips.filter(clip => timelineState.selectedClips.includes(clip.id));
    if (selectedClips.length < 2) return;
    
    // Find which track these clips belong to
    const trackId = selectedClips[0].trackId;
    if (!selectedClips.every(clip => clip.trackId === trackId)) {
      console.warn('Cannot group clips from different tracks');
      return;
    }
    
    const groupId = `group-${Date.now()}`;
    console.log(`🔗 Creating group ${groupId} with ${selectedClips.length} clips on track ${trackId}`);
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => 
          timelineState.selectedClips.includes(clip.id)
            ? { ...clip, groupId, groupTrackIndex: timelineState.selectedClips.indexOf(clip.id) }
            : clip
        )
      })),
      groups: [
        ...prev.groups,
        {
          id: groupId,
          name: `Group ${prev.groups.length + 1}`,
          clipIds: timelineState.selectedClips,
          color: selectedClips[0].color,
          collapsed: true, // Start collapsed
          trackId: trackId,
        }
      ],
      selectedClips: [],
    }));
  }, [timelineState.selectedClips, allClips]);

  // Ungroup functionality
  const handleUngroup = useCallback(() => {
    const selectedClips = allClips.filter(clip => timelineState.selectedClips.includes(clip.id));
    const groupIds = [...new Set(selectedClips.map(clip => clip.groupId).filter(Boolean))];
    
    if (groupIds.length === 0) return;
    
    console.log(`🔓 Ungrouping ${groupIds.length} groups`);
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => 
          groupIds.includes(clip.groupId!)
            ? { ...clip, groupId: undefined, groupTrackIndex: undefined }
            : clip
        )
      })),
      groups: prev.groups.filter(group => !groupIds.includes(group.id)),
      selectedClips: [],
    }));
  }, [timelineState.selectedClips, allClips]);

  // Check if selection has grouped clips
  const hasGroupedSelection = allClips
    .filter(clip => timelineState.selectedClips.includes(clip.id))
    .some(clip => clip.groupId);

  // Group click handler
  const handleGroupClick = useCallback((groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const group = timelineState.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Select all clips in the group
    console.log(`👆 Group clicked: ${groupId}, selecting ${group.clipIds.length} clips`);
    setTimelineState(prev => ({
      ...prev,
      selectedClips: group.clipIds,
    }));
  }, [timelineState.groups]);

  // Group mouse down handler for drag operations
  const handleGroupMouseDown = useCallback((groupId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => {
    const group = timelineState.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Make sure all clips in group are selected
    setTimelineState(prev => ({
      ...prev,
      selectedClips: group.clipIds,
    }));
    
    // Start drag operation for all clips in group
    const groupClips = allClips.filter(clip => group.clipIds.includes(clip.id));
    if (groupClips.length === 0) return;
    
    setDragState({
      isDragging: true,
      dragType,
      clipId: groupClips[0].id, // Use first clip as primary
      selectedClipIds: group.clipIds,
      startX: event.clientX,
      startY: event.clientY,
      startTime: groupClips[0].startTime,
      originalClips: groupClips,
      targetTrackId: null,
      trackOffsets: new Map(),
      isValidDrop: false,
      collisionDetected: false,
      dragStarted: false,
      showNewTrackIndicator: false,
    });
  }, [timelineState.groups, allClips]);

  // Expand group handler
  const handleExpandGroup = useCallback((groupId: string) => {
    console.log(`🔽 Expanding group: ${groupId}`);
    setTimelineState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, collapsed: false } : group
      )
    }));
  }, []);

  // Collapse group handler
  const handleCollapseGroup = useCallback((groupId: string) => {
    console.log(`🔼 Collapsing group: ${groupId}`);
    setTimelineState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, collapsed: true } : group
      )
    }));
  }, []);

  // Play/pause functionality (placeholder)
  const handlePlayPause = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  // Zoom functionality
  const handleZoomIn = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel + 0.25, 2.5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel - 0.25, 0.5),
    }));
  }, []);

  const handleZoomSlider = useCallback((value: number) => {
    setTimelineState(prev => ({
      ...prev,
      zoomLevel: value,
    }));
  }, []);

  // Clip click handler
  const handleClipClick = useCallback((clipId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const isMetaKey = event.metaKey || event.ctrlKey;
    
    if (isMetaKey) {
      // Toggle selection
      setTimelineState(prev => ({
        ...prev,
        selectedClips: prev.selectedClips.includes(clipId)
          ? prev.selectedClips.filter(id => id !== clipId)
          : [...prev.selectedClips, clipId],
      }));
    } else {
      // Single selection
      setTimelineState(prev => ({
        ...prev,
        selectedClips: [clipId],
      }));
    }
    
    // Clear range selection when clicking clips
    setRangeSelection(null);
  }, []);

  // Clip mouse down handler for dragging
  const handleClipMouseDown = useCallback((clipId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => {
    const clip = allClips.find(c => c.id === clipId);
    if (!clip) return;

    // Ensure this clip is selected
    if (!timelineState.selectedClips.includes(clipId)) {
      setTimelineState(prev => ({
        ...prev,
        selectedClips: [clipId],
      }));
    }

    const selectedClips = timelineState.selectedClips.includes(clipId) 
      ? allClips.filter(c => timelineState.selectedClips.includes(c.id))
      : [clip];

    setDragState({
      isDragging: true,
      dragType,
      clipId,
      selectedClipIds: selectedClips.map(c => c.id),
      startX: event.clientX,
      startY: event.clientY,
      startTime: clip.startTime,
      originalClips: selectedClips,
      targetTrackId: clip.trackId,
      trackOffsets: new Map(),
      isValidDrop: false,
      collisionDetected: false,
      dragStarted: false,
      showNewTrackIndicator: false,
    });
  }, [timelineState.selectedClips, allClips]);

  // Mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.isDragging) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      const deltaTime = pixelToTime(deltaX);

      // Start dragging after moving more than 5 pixels
      if (!dragState.dragStarted && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        setDragState(prev => ({ ...prev, dragStarted: true }));
      }

      if (!dragState.dragStarted) return;

      // Calculate snap position
      const targetTime = dragState.startTime + deltaTime;
      const snapResult = calculateSnapPosition(
        timeToPixel(targetTime),
        allClips.filter(c => !dragState.selectedClipIds.includes(c.id)),
        dragState.selectedClipIds,
        10,
        timeToPixel
      );

      // Update snap state
      setSnapState({
        isSnapping: snapResult.snapPosition !== null,
        snapPosition: snapResult.snapPosition,
        snapType: 'start',
        targetClipId: snapResult.targetClipId,
      });

      // Calculate final position (with snap if applicable)
      const finalTime = snapResult.snapPosition !== null ? snapResult.snapPosition : targetTime;
      const clampedTime = Math.max(0, finalTime);

      // Update drag preview
      if (dragState.dragType === "move") {
        // Update clip positions for preview
        setTimelineState(prev => ({
          ...prev,
          tracks: prev.tracks.map(track => ({
            ...track,
            clips: track.clips.map(clip => {
              if (dragState.selectedClipIds.includes(clip.id)) {
                const originalClip = dragState.originalClips.find(c => c.id === clip.id);
                if (originalClip) {
                  const timeOffset = clampedTime - dragState.startTime;
                  return {
                    ...clip,
                    startTime: originalClip.startTime + timeOffset,
                    endTime: originalClip.endTime + timeOffset,
                  };
                }
              }
              return clip;
            })
          }))
        }));
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        // Clear snap state
        setSnapState({
          isSnapping: false,
          snapPosition: null,
          snapType: null,
          targetClipId: null,
        });

        // Reset drag state
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
      }
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, pixelToTime, allClips, timeToPixel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (rangeSelection) {
          handleRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
        } else if (timelineState.selectedClips.length > 0) {
          handleDelete();
        }
      } else if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (rangeSelection) {
          handleRangeSplit(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
        } else {
          handleSplit();
        }
      } else if (event.key === 'g' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (hasGroupedSelection) {
          handleUngroup();
        } else {
          handleGroup();
        }
      } else if (event.key === ' ') {
        event.preventDefault();
        handlePlayPause();
      } else if (event.key === 'Escape') {
        // Clear selections
        setTimelineState(prev => ({ ...prev, selectedClips: [] }));
        setRangeSelection(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    timelineState.selectedClips,
    rangeSelection,
    hasGroupedSelection,
    handleDelete,
    handleSplit,
    handleRangeSplit,
    handleRangeDelete,
    handleGroup,
    handleUngroup,
    handlePlayPause,
  ]);

  // Background click handler
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    // Only deselect if clicking on the actual background
    const target = event.target as HTMLElement;
    const isClickingBackground = target.closest('[data-clip-id]') === null && 
                                target.closest('[data-group-id]') === null &&
                                !target.closest('button');
    
    if (isClickingBackground) {
      setTimelineState(prev => ({ ...prev, selectedClips: [] }));
      setRangeSelection(null);
    }
  }, []);

  // Playhead click handler
  const handlePlayheadClick = useCallback((event: React.MouseEvent) => {
    if (!tracksContainerRef.current) return;
    
    const rect = tracksContainerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 40; // Account for track labels
    const clickTime = pixelToTime(clickX);
    const clampedTime = Math.max(0, Math.min(clickTime, timelineState.totalDuration));
    
    setTimelineState(prev => ({
      ...prev,
      playheadPosition: clampedTime,
    }));
  }, [pixelToTime, timelineState.totalDuration]);

  return (
    <div className="w-full h-full bg-[#0d0d0d] text-white overflow-hidden">
      {/* Controls */}
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
        hasGroupedSelection={hasGroupedSelection}
        timelineState={timelineState}
        rangeSelection={rangeSelection}
        onRangeSplit={handleRangeSplit}
        onRangeDelete={handleRangeDelete}
        onClearRangeSelection={handleClearRangeSelection}
      />

      {/* Timeline Ruler */}
      <TimelineRuler
        timeToPixel={timeToPixel}
        totalDuration={timelineState.totalDuration}
        zoomLevel={timelineState.zoomLevel}
      />

      {/* Tracks Container */}
      <div 
        ref={tracksContainerRef}
        className="relative overflow-auto"
        style={{ height: 'calc(100% - 78px)' }}
        onClick={handleBackgroundClick}
      >
        {/* Track Labels Column */}
        <div className="absolute left-0 top-0 w-10 h-full bg-[#1d1d1d] border-r border-[#2b2b2b] z-20">
          {timelineState.tracks.map((track, index) => (
            <div
              key={track.id}
              className="h-[66px] flex items-center justify-center text-xs text-[#666666] border-b border-[#2b2b2b]"
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Timeline Content */}
        <div 
          className="ml-10 relative cursor-pointer"
          onClick={handlePlayheadClick}
          style={{ 
            minWidth: `${timeToPixel(timelineState.totalDuration) + 100}px`,
            minHeight: `${timelineState.tracks.length * 66}px`
          }}
        >
          {/* Tracks */}
          {timelineState.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              clips={track.clips}
              onClipClick={handleClipClick}
              onClipMouseDown={handleClipMouseDown}
              timeToPixel={timeToPixel}
              zoomLevel={timelineState.zoomLevel}
              snapState={snapState}
              dragState={dragState}
              isDropTarget={false}
              isValidDropTarget={false}
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
          ))}

          {/* Expanded Groups - Rendered separately for proper layering */}
          {timelineState.groups
            .filter(group => !group.collapsed)
            .map((group) => {
              const groupClips = allClips.filter(clip => clip.groupId === group.id);
              if (groupClips.length === 0) return null;

              const isGroupSelected = group.clipIds.every(clipId =>
                timelineState.selectedClips.includes(clipId)
              );

              return (
                <GroupTrackRow
                  key={`expanded-${group.id}`}
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

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
            style={{
              left: `${timeToPixel(timelineState.playheadPosition)}px`,
            }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-sm" />
          </div>

          {/* Snap Indicator */}
          <SnapIndicator
            timeToPixel={timeToPixel}
            snapState={snapState}
          />
        </div>
      </div>
    </div>
  );
}