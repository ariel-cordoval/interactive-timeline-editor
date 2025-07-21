import { TimelineClip, TimelineTrack } from "../types/timeline";

// Time formatting utilities
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Color generation utilities
export const getSpeakerColor = (clipName: string, clipColor?: string): string => {
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

// Timeline calculation utilities
export const calculateInitialDuration = (tracks: TimelineTrack[]): number => {
  let maxDuration = 15; // Minimum 15 seconds

  tracks.forEach(track => {
    track.clips.forEach(clip => {
      maxDuration = Math.max(maxDuration, clip.startTime + clip.duration);
    });
  });

  return Math.max(maxDuration, 30); // Ensure at least 30 seconds
};

// Collision detection utilities
export const timeOverlaps = (start1: number, end1: number, start2: number, end2: number): boolean => {
  return start1 < end2 && end1 > start2;
};

export const findAvailableTrackForClip = (
  tracks: TimelineTrack[],
  clipStartTime: number, 
  clipEndTime: number, 
  excludeClipIds: string[] = [],
  startFromTrack: number = 0
): string => {
  for (let i = startFromTrack; i < tracks.length; i++) {
    const track = tracks[i];
    const hasCollision = track.clips.some(existingClip => {
      if (excludeClipIds.includes(existingClip.id)) return false;
      return timeOverlaps(clipStartTime, clipEndTime, existingClip.startTime, existingClip.endTime);
    });
    
    if (!hasCollision) {
      return track.id;
    }
  }
  
  // If no available track found, create a new one
  return `track-${tracks.length + 1}`;
};

// Snap calculation utilities
export const calculateSnapPosition = (
  position: number,
  allClips: TimelineClip[],
  excludeClipIds: string[] = [],
  snapThreshold: number = 5,
  timeToPixel: (time: number) => number
): { snapPosition: number | null; targetClipId: string | null } => {
  let closestSnap: number | null = null;
  let closestDistance = Infinity;
  let targetClipId: string | null = null;

  allClips.forEach(clip => {
    if (excludeClipIds.includes(clip.id)) return;

    // Check snap to start and end of clips
    const clipStart = timeToPixel(clip.startTime);
    const clipEnd = timeToPixel(clip.endTime);
    
    const startDistance = Math.abs(position - clipStart);
    const endDistance = Math.abs(position - clipEnd);

    if (startDistance < snapThreshold && startDistance < closestDistance) {
      closestSnap = clip.startTime;
      closestDistance = startDistance;
      targetClipId = clip.id;
    }

    if (endDistance < snapThreshold && endDistance < closestDistance) {
      closestSnap = clip.endTime;
      closestDistance = endDistance;
      targetClipId = clip.id;
    }
  });

  return { snapPosition: closestSnap, targetClipId };
};

// Audio processing utilities
export const generateWaveformData = (audioBuffer: AudioBuffer): Float32Array => {
  const channelData = audioBuffer.getChannelData(0);
  const samples = 100;
  const blockSize = Math.floor(channelData.length / samples);
  const waveformData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[blockStart + j]);
    }
    waveformData[i] = sum / blockSize;
  }

  return waveformData;
};

// Validation utilities
export const validateTimelineState = (tracks: TimelineTrack[]): boolean => {
  // Check for duplicate clip IDs
  const allClipIds = tracks.flatMap(track => track.clips.map(clip => clip.id));
  const uniqueClipIds = new Set(allClipIds);
  if (allClipIds.length !== uniqueClipIds.size) {
    console.error('Duplicate clip IDs found in timeline state');
    return false;
  }

  // Check for negative durations or start times
  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.duration <= 0 || clip.startTime < 0) {
        console.error(`Invalid clip timing: ${clip.id}`);
        return false;
      }
    }
  }

  return true;
}; 