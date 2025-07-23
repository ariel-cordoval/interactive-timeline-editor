import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import GroupTrackRowComponent from "./timeline/GroupTrackRow";
import TrackRowComponent from "./timeline/TrackRow";
import TimelineRulerComponent from "./timeline/TimelineRuler";
import SnapIndicatorComponent from "./timeline/SnapIndicator";
import InteractiveControlsComponent from "./timeline/InteractiveControls";
import { useSmoothZoom } from "./hooks/useSmoothZoom";
import {
  TimelineClip,
  TimelineTrack,
  TimelineState,
  DragState,
  SnapState,
  AudioTrack,
  MouseDownState,
  ClipboardData,
  InteractiveTrackEditorProps,
  RangeSelection,
} from "./types/timeline";
import {
  processRawAudioFile,
  generateWaveformData,
  getDefaultAudioFiles,
  loadAudioFromUrl,
  isAudioFile,
  getFileTypeLabel,
  getTrackColors,
} from "./utils/audioUtils";

export default function InteractiveTrackEditor({
  onTimelineChange,
}: InteractiveTrackEditorProps) {
  // Debug info on component mount
  useEffect(() => {
    console.log(`🎬 Interactive Timeline Editor loaded - Debugging enabled`);
    console.log(`🔧 If drag-and-drop gets stuck, press ESC to reset`);
    console.log(`📝 Watch console for detailed drag operation logs`);
  }, []);

  const [_audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

  // Function to load default audio files (Roni.wav and Ingrid.wav)
  const loadDefaultAudioFiles = useCallback(async () => {
    const defaultFiles = getDefaultAudioFiles();
    const loadedClips: TimelineClip[] = [];
    const loadedAudioTracks: AudioTrack[] = [];

    for (const fileInfo of defaultFiles) {
      try {
        console.log(`🎵 Loading default file: ${fileInfo.path}`);
        
        const { audioBuffer, audioContext } = await loadAudioFromUrl(fileInfo.path);
        const duration = audioBuffer.duration;
        const waveformData = generateWaveformData(audioBuffer);
        
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
          waveformData: waveformData,
          waveformColor: fileInfo.color,
          sourceStartOffset: 0,
        };
        
        loadedClips.push(newClip);
        
        // Store audio data for playback
        loadedAudioTracks.push({
          id: `default-audio-${fileName}`,
          name: fileName,
          file: { name: fileInfo.path },
          audioBuffer: audioBuffer,
          audioContext: audioContext,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channelData: audioBuffer.getChannelData(0),
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

  const [timelineState, setTimelineState] = useState<TimelineState>({
    playheadPosition: 5,
    zoomLevel: 1,
    selectedClips: [],
    tracks: initialTracks,
    groups: [],
    isPlaying: false,
    totalDuration: calculateInitialDuration(initialTracks),
  });

  // Initialize smooth zoom hook
  const smoothZoom = useSmoothZoom(
    timelineState.zoomLevel,
    timelineState.totalDuration,
    {
      minZoom: 0.1,
      maxZoom: 50,
      animationDuration: 100,
      zoomStep: 1.4,
      wheelSensitivity: 0.005,
    }
  );

  // Viewport offset for horizontal scrolling
  const [viewportOffset, setViewportOffset] = useState(0);

  // Range selection state
  const [rangeSelection, setRangeSelection] = useState<RangeSelection | null>(null);

  // Clipboard state for copy/paste operations
  const [clipboardData, _setClipboardData] = useState<ClipboardData | null>(null);

  const [dragState, _setDragState] = useState<DragState>({
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

  const [snapState, _setSnapState] = useState<SnapState>({
    isSnapping: false,
    snapPosition: null,
    snapType: null,
    targetClipId: null,
  });

  // Track mouse down state for click vs drag detection
  const [_mouseDownState, _setMouseDownState] = useState<MouseDownState>({
    isMouseDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    clipId: null,
    dragType: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const trackAreaRef = useRef<HTMLDivElement>(null);

  // Sync smooth zoom state with timeline state
  useEffect(() => {
    setTimelineState((prev) => ({
      ...prev,
      zoomLevel: smoothZoom.zoomLevel,
    }));
    
    // Reset viewport offset if zoom changed significantly
    const timelineWidth = 1262;
    const totalWidth = timelineWidth * smoothZoom.zoomLevel;
    const maxOffset = Math.max(0, totalWidth - timelineWidth);
    
    setViewportOffset(prevOffset => {
      if (prevOffset > maxOffset) {
        return maxOffset;
      }
      return prevOffset;
    });
  }, [smoothZoom.zoomLevel]);

  // Notify parent of timeline changes
  useEffect(() => {
    if (onTimelineChange) {
      onTimelineChange(timelineState);
    }
  }, [timelineState, onTimelineChange]);

  // Load default audio files on mount
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { clips, audioTracks } = await loadDefaultAudioFiles();
        
        if (clips.length > 0) {
          // Update tracks with loaded clips
          setTimelineState(prev => {
            const updatedTracks = prev.tracks.map(track => {
              const trackClips = clips.filter(clip => clip.trackId === track.id);
              return {
                ...track,
                clips: trackClips
              };
            });
            
            const newDuration = calculateInitialDuration(updatedTracks);
            
            return {
              ...prev,
              tracks: updatedTracks,
              totalDuration: newDuration,
            };
          });
          
          setAudioTracks(audioTracks);
        }
      } catch (error) {
        console.error('Failed to load default audio files:', error);
      }
    };

    loadDefaults();
  }, [loadDefaultAudioFiles]);

  // Time to pixel conversion
  const timeToPixel = useCallback(
    (time: number) => {
      const timelineWidth = 1262;
      const pixelsPerSecond = (timelineWidth * smoothZoom.zoomLevel) / timelineState.totalDuration;
      return time * pixelsPerSecond - viewportOffset;
    },
    [smoothZoom.zoomLevel, timelineState.totalDuration, viewportOffset],
  );

  // Event handlers (simplified versions - detailed implementations would be needed)
  const handleClipClick = useCallback((clipId: string, _event: React.MouseEvent) => {
    console.log('Clip clicked:', clipId);
    // Add clip selection logic
  }, []);

  const handleClipMouseDown = useCallback((clipId: string, _event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => {
    console.log('Clip mouse down:', clipId, dragType);
    // Add drag initialization logic
  }, []);

  const handleGroupClick = useCallback((groupId: string, _event: React.MouseEvent) => {
    console.log('Group clicked:', groupId);
    // Add group selection logic
  }, []);

  const handleGroupMouseDown = useCallback((groupId: string, _event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => {
    console.log('Group mouse down:', groupId, dragType);
    // Add group drag logic
  }, []);

  const handleExpandGroup = useCallback((groupId: string) => {
    console.log('Expand group:', groupId);
    // Add group expansion logic
  }, []);

  const handleCollapseGroup = useCallback((groupId: string) => {
    console.log('Collapse group:', groupId);
    // Add group collapse logic
  }, []);

  const handleRangeSelect = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    console.log('Range selected:', clipId, startOffset, endOffset);
    setRangeSelection({ clipId, startOffset, endOffset });
  }, []);

  const handleRangeSplit = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    console.log('Range split:', clipId, startOffset, endOffset);
    // Add range split logic
  }, []);

  const handleRangeDelete = useCallback((clipId: string, startOffset: number, endOffset: number) => {
    console.log('Range delete:', clipId, startOffset, endOffset);
    // Add range delete logic
  }, []);

  const clearRangeSelection = useCallback(() => {
    setRangeSelection(null);
  }, []);

  // Control handlers
  const handleSplit = useCallback(() => {
    console.log('Split clips');
    // Add split logic
  }, []);

  const handleDelete = useCallback(() => {
    console.log('Delete clips');
    // Add delete logic
  }, []);

  const handleGroup = useCallback(() => {
    console.log('Group clips');
    // Add group logic
  }, []);

  const handleUngroup = useCallback(() => {
    console.log('Ungroup clips');
    // Add ungroup logic
  }, []);

  const handlePlayPause = useCallback(() => {
    console.log('Play/pause');
    setTimelineState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleZoomIn = useCallback(() => {
    smoothZoom.zoomIn();
  }, [smoothZoom]);

  const handleZoomOut = useCallback(() => {
    smoothZoom.zoomOut();
  }, [smoothZoom]);

  const handleZoomSlider = useCallback((value: number) => {
    smoothZoom.setZoomLevel(value);
  }, [smoothZoom]);

  const handleTimelineClick = useCallback((_event: React.MouseEvent) => {
    // Add timeline click logic for playhead positioning
    console.log('Timeline clicked');
  }, []);

  const handleBackgroundClick = useCallback((_event: React.MouseEvent) => {
    // Clear selections
    setTimelineState(prev => ({ ...prev, selectedClips: [] }));
    clearRangeSelection();
  }, [clearRangeSelection]);

  const handleCopy = useCallback(() => {
    console.log('Copy');
    // Add copy logic
  }, []);

  const handlePaste = useCallback(() => {
    console.log('Paste');
    // Add paste logic
  }, []);

  const hasGroupedSelection = useCallback(() => {
    // Check if any selected clips are in groups
    return false; // Placeholder
  }, []);

  // File selection handler
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const trackColors = getTrackColors();
    
    for (const file of Array.from(files)) {
      if (!isAudioFile(file)) {
        console.warn(`Skipping non-audio file: ${file.name}`);
        continue;
      }
      
      const fileTypeLabel = getFileTypeLabel(file);
      
      try {
        console.log(`🎵 Loading ${fileTypeLabel} file: ${file.name}...`);
        
        const arrayBuffer = await file.arrayBuffer();
        let audioBuffer: AudioBuffer;
        let audioContext: AudioContext;
        
        if (file.name.toLowerCase().endsWith('.raw') || file.name.toLowerCase().endsWith('.pcm')) {
          const result = await processRawAudioFile(file, arrayBuffer);
          audioBuffer = result.audioBuffer;
          audioContext = result.audioContext;
        } else {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }
        
        const waveformData = generateWaveformData(audioBuffer);
        const fileName = file.name.replace(/\.(wav|mp3|flac|ogg|raw|pcm)$/i, '');
        
        // Create new clip and add to timeline
        const newClip: TimelineClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          trackId: timelineState.tracks[0]?.id || 'track-1',
          startTime: 0,
          endTime: audioBuffer.duration,
          duration: audioBuffer.duration,
          type: "audio" as const,
          name: fileName,
          color: trackColors[0],
          selected: false,
          waveformData: waveformData,
          waveformColor: trackColors[0],
          sourceStartOffset: 0,
        };
        
        // Add clip to timeline
        setTimelineState(prev => {
          const updatedTracks = prev.tracks.map(track => {
            if (track.id === newClip.trackId) {
              return {
                ...track,
                clips: [...track.clips, newClip]
              };
            }
            return track;
          });
          
          return {
            ...prev,
            tracks: updatedTracks,
            totalDuration: calculateInitialDuration(updatedTracks),
          };
        });
        
        console.log(`✅ Successfully loaded ${fileName}`);
        
      } catch (error) {
        console.error(`❌ Error loading ${file.name}:`, error);
      }
    }
  }, [timelineState.tracks]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0e0e0e] flex flex-col select-none"
    >
      {/* Action Bar */}
      <InteractiveControlsComponent
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
        zoomLevel={smoothZoom.zoomLevel}
        hasGroupedSelection={hasGroupedSelection()}
        rangeSelection={rangeSelection}
        onRangeSplit={handleRangeSplit}
        onRangeDelete={handleRangeDelete}
        onClearRangeSelection={clearRangeSelection}
        onCopy={handleCopy}
        onPaste={handlePaste}
        hasClipboardData={clipboardData !== null}
      />

      {/* Timeline Ruler */}
      <div
        className="relative cursor-pointer"
        onClick={handleTimelineClick}
      >
        <TimelineRulerComponent
          timeToPixel={timeToPixel}
          totalDuration={timelineState.totalDuration}
          zoomLevel={timelineState.zoomLevel}
        />
        
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-50 transition-all duration-75"
          style={{
            left: `${40 + timeToPixel(timelineState.playheadPosition)}px`,
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-white rounded-full border border-[#0e0e0e]" />
        </div>
      </div>

      {/* Snap Indicator */}
      <SnapIndicatorComponent
        timeToPixel={timeToPixel}
        snapState={snapState}
      />

      {/* Track Area */}
      <div
        ref={trackAreaRef}
        className="flex-1 bg-[#0e0e0e] overflow-hidden select-none"
        onClick={handleBackgroundClick}
      >
        <div className="pl-[40px] pr-4 py-2">
          {/* Expanded Groups */}
          {timelineState.groups.filter(group => !group.collapsed).map(group => {
            const groupClips = timelineState.tracks
              .flatMap(t => t.clips)
              .filter(clip => group.clipIds.includes(clip.id));
            
            if (groupClips.length === 0) return null;
            
            const isGroupSelected = group.clipIds.every(clipId =>
              timelineState.selectedClips.includes(clipId)
            );

            return (
              <GroupTrackRowComponent
                key={`expanded-group-${group.id}`}
                group={group}
                clips={groupClips}
                onGroupClick={handleGroupClick}
                onGroupMouseDown={handleGroupMouseDown}
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

          {/* Regular Tracks */}
          {timelineState.tracks.map((track) => {
            const trackClips = track.clips.filter(clip => {
              if (!clip.groupId) return true;
              const group = timelineState.groups.find(g => g.id === clip.groupId);
              return group && group.collapsed;
            });

            const isDropTarget = false; // Placeholder
            const isValidDropTarget = false; // Placeholder

            return (
              <TrackRowComponent
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

      {/* Add Track Button */}
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