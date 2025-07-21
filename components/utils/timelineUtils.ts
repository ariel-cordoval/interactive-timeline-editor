import { TimelineTrack, TimelineClip } from '../types/timeline';

// Calculate initial duration based on tracks
export const calculateInitialDuration = (tracks: TimelineTrack[]): number => {
  let maxEndTime = 0;
  tracks.forEach(track => {
    track.clips.forEach(clip => {
      maxEndTime = Math.max(maxEndTime, clip.endTime);
    });
  });
  const padding = Math.max(30, maxEndTime * 0.2);
  return Math.max(60, maxEndTime + padding);
};

// Check if two time ranges overlap
export const timeOverlaps = (
  start1: number, 
  end1: number, 
  start2: number, 
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

// Find available track for a clip (avoiding collisions)
export const findAvailableTrackForClip = (
  clip: TimelineClip,
  tracks: TimelineTrack[],
  excludeClipIds: string[] = []
): string | null => {
  for (const track of tracks) {
    const hasCollision = track.clips.some(existingClip => {
      if (excludeClipIds.includes(existingClip.id)) return false;
      return timeOverlaps(
        clip.startTime,
        clip.endTime,
        existingClip.startTime,
        existingClip.endTime
      );
    });
    
    if (!hasCollision) {
      return track.id;
    }
  }
  
  return null;
};

// Calculate snap position for dragging clips
export const calculateSnapPosition = (
  currentPosition: number,
  otherClips: TimelineClip[],
  draggedClipIds: string[],
  snapThreshold: number = 10,
  timeToPixel: (time: number) => number
): {
  snapPosition: number | null;
  targetClipId: string | null;
} => {
  let closestSnap = null;
  let closestDistance = Infinity;
  let targetClipId = null;

  for (const clip of otherClips) {
    if (draggedClipIds.includes(clip.id)) continue;

    const clipStartPixel = timeToPixel(clip.startTime);
    const clipEndPixel = timeToPixel(clip.endTime);

    // Check snap to start
    const startDistance = Math.abs(currentPosition - clipStartPixel);
    if (startDistance < snapThreshold && startDistance < closestDistance) {
      closestDistance = startDistance;
      closestSnap = clip.startTime;
      targetClipId = clip.id;
    }

    // Check snap to end
    const endDistance = Math.abs(currentPosition - clipEndPixel);
    if (endDistance < snapThreshold && endDistance < closestDistance) {
      closestDistance = endDistance;
      closestSnap = clip.endTime;
      targetClipId = clip.id;
    }
  }

  return {
    snapPosition: closestSnap,
    targetClipId,
  };
};

// Generate waveform data from audio buffer
export const generateWaveformData = (audioBuffer: AudioBuffer): Float32Array => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const duration = audioBuffer.duration;
  
  // Target number of samples for visualization
  const targetSamples = Math.min(1000, Math.floor(duration * 10));
  const blockSize = Math.floor(channelData.length / targetSamples);
  
  const waveformData = new Float32Array(targetSamples);
  
  for (let i = 0; i < targetSamples; i++) {
    let blockSum = 0;
    const startIdx = i * blockSize;
    const endIdx = Math.min(startIdx + blockSize, channelData.length);
    
    for (let j = startIdx; j < endIdx; j++) {
      blockSum += Math.abs(channelData[j]);
    }
    
    waveformData[i] = blockSum / blockSize;
  }
  
  return waveformData;
};

// Validate timeline state for debugging
export const validateTimelineState = (tracks: TimelineTrack[]): boolean => {
  let isValid = true;
  
  tracks.forEach(track => {
    // Check for overlapping clips within the same track
    for (let i = 0; i < track.clips.length; i++) {
      for (let j = i + 1; j < track.clips.length; j++) {
        const clip1 = track.clips[i];
        const clip2 = track.clips[j];
        
        if (timeOverlaps(clip1.startTime, clip1.endTime, clip2.startTime, clip2.endTime)) {
          console.warn(`Overlapping clips detected in track ${track.id}:`, {
            clip1: { id: clip1.id, start: clip1.startTime, end: clip1.endTime },
            clip2: { id: clip2.id, start: clip2.startTime, end: clip2.endTime }
          });
          isValid = false;
        }
      }
    }
    
    // Check for invalid time ranges
    track.clips.forEach(clip => {
      if (clip.startTime >= clip.endTime) {
        console.warn(`Invalid time range for clip ${clip.id}:`, {
          startTime: clip.startTime,
          endTime: clip.endTime
        });
        isValid = false;
      }
      
      if (clip.startTime < 0) {
        console.warn(`Negative start time for clip ${clip.id}:`, clip.startTime);
        isValid = false;
      }
    });
  });
  
  return isValid;
};

// Helper to calculate clip positions after drag operations
export const calculateClipPositions = (
  clips: TimelineClip[],
  deltaTime: number,
  snapPosition?: number
): TimelineClip[] => {
  const finalDelta = snapPosition !== null && snapPosition !== undefined
    ? snapPosition - clips[0].startTime
    : deltaTime;

  return clips.map(clip => ({
    ...clip,
    startTime: clip.startTime + finalDelta,
    endTime: clip.endTime + finalDelta,
  }));
};

// Helper to check if clips can be moved to a target track
export const canMoveClipsToTrack = (
  clips: TimelineClip[],
  targetTrackId: string,
  tracks: TimelineTrack[],
  deltaTime: number = 0
): boolean => {
  const targetTrack = tracks.find(t => t.id === targetTrackId);
  if (!targetTrack) return false;

  const movedClips = clips.map(clip => ({
    ...clip,
    startTime: clip.startTime + deltaTime,
    endTime: clip.endTime + deltaTime,
  }));

  // Check for collisions with existing clips in target track
  for (const movedClip of movedClips) {
    for (const existingClip of targetTrack.clips) {
      // Skip if it's the same clip (in case of moving within same track)
      if (existingClip.id === movedClip.id) continue;
      
      if (timeOverlaps(
        movedClip.startTime,
        movedClip.endTime,
        existingClip.startTime,
        existingClip.endTime
      )) {
        return false;
      }
    }
  }

  return true;
}; 