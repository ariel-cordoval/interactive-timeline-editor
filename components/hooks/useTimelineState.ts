import { useState, useCallback, useMemo } from 'react';

// Define types locally to avoid import issues
interface TimelineClip {
  id: string;
  name: string;
  trackName?: string;
  startTime: number;
  endTime: number;
  duration: number;
  selected: boolean;
  trackId: string;
  groupId?: string;
  groupTrackIndex?: number;
  sourceStartOffset: number;
  waveformData?: Float32Array;
  waveformColor?: string;
}

interface TimelineTrack {
  id: string;
  name: string;
  clips: TimelineClip[];
}

interface TimelineGroup {
  id: string;
  name: string;
  clipIds: string[];
  color: string;
  collapsed: boolean;
  trackId: string;
}

interface TimelineState {
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  tracks: TimelineTrack[];
  groups: TimelineGroup[];
  isPlaying: boolean;
  totalDuration: number;
}

export const useTimelineState = (initialTracks: TimelineTrack[]) => {
  // Calculate initial duration
  const calculateInitialDuration = useCallback((tracks: TimelineTrack[]): number => {
    let maxEndTime = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxEndTime = Math.max(maxEndTime, clip.endTime);
      });
    });
    const padding = Math.max(30, maxEndTime * 0.2);
    return Math.max(60, maxEndTime + padding);
  }, []);

  const [timelineState, setTimelineState] = useState<TimelineState>({
    playheadPosition: 5,
    zoomLevel: 1,
    selectedClips: [],
    tracks: initialTracks,
    groups: [],
    isPlaying: false,
    totalDuration: calculateInitialDuration(initialTracks),
  });

  // Memoized calculations
  const calculations = useMemo(() => ({
    calculateTimelineDuration: (tracks: TimelineTrack[]): number => {
      let maxEndTime = 0;
      tracks.forEach(track => {
        track.clips.forEach(clip => {
          maxEndTime = Math.max(maxEndTime, clip.endTime);
        });
      });
      const padding = Math.max(30, maxEndTime * 0.2);
      return Math.max(60, maxEndTime + padding);
    },

    getClipsInGroup: (clipId: string): string[] => {
      const allClips = timelineState.tracks.flatMap(track => track.clips);
      const clip = allClips.find(c => c.id === clipId);
      
      if (!clip?.groupId) return [clipId];
      
      const group = timelineState.groups.find(g => g.id === clip.groupId);
      return group ? group.clipIds : [clipId];
    },

    hasGroupedSelection: (): boolean => {
      const allClips = timelineState.tracks.flatMap(track => track.clips);
      return timelineState.selectedClips.some(clipId => {
        const clip = allClips.find(c => c.id === clipId);
        return clip?.groupId && timelineState.groups.some(g => g.id === clip.groupId);
      });
    }
  }), [timelineState]);

  // State update helpers
  const updateTimelineState = useCallback((updater: (prev: TimelineState) => TimelineState) => {
    setTimelineState(updater);
  }, []);

  const updatePlayheadPosition = useCallback((position: number) => {
    setTimelineState(prev => ({
      ...prev,
      playheadPosition: Math.max(0, Math.min(position, prev.totalDuration))
    }));
  }, []);

  const updateZoomLevel = useCallback((zoomLevel: number) => {
    setTimelineState(prev => ({
      ...prev,
      zoomLevel: Math.max(0.5, Math.min(4, zoomLevel))
    }));
  }, []);

  const selectClips = useCallback((clipIds: string[]) => {
    setTimelineState(prev => ({
      ...prev,
      selectedClips: clipIds,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => ({
          ...clip,
          selected: clipIds.includes(clip.id)
        }))
      }))
    }));
  }, []);

  const clearSelection = useCallback(() => {
    selectClips([]);
  }, [selectClips]);

  return {
    timelineState,
    setTimelineState,
    updateTimelineState,
    updatePlayheadPosition,
    updateZoomLevel,
    selectClips,
    clearSelection,
    calculations
  };
}; 