export interface TimelineClip {
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

export interface TimelineGroup {
  id: string;
  name: string;
  clipIds: string[];
  color: string;
  collapsed: boolean;
  trackId: string; // Groups now belong to a specific track like clips
}

export interface AudioTrackSegment {
  clipId: string;
  startTime: number;
  duration: number;
  audioData: Float32Array;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: "audio" | "video";
  clips: TimelineClip[];
  height: number;
}

export interface TimelineState {
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  tracks: TimelineTrack[];
  groups: TimelineGroup[]; // Add groups to timeline state
  isPlaying: boolean;
  totalDuration: number;
}

export interface InteractiveTrackEditorProps {
  onTimelineChange?: (state: TimelineState) => void;
}

// Enhanced drag state for vertical movement
export interface DragState {
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
export interface SnapState {
  isSnapping: boolean;
  snapPosition: number | null;
  snapType: "start" | "end" | null;
  targetClipId: string | null;
}

export interface RangeSelection {
  clipId: string;
  startOffset: number;
  endOffset: number;
} 