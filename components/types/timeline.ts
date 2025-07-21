// Core timeline types

export interface TimelineClip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: "audio" | "video" | "image";
  name: string;
  color: string;
  selected: boolean;
  waveformData?: Float32Array;
  waveformColor?: string;
  sourceStartOffset: number;
  groupId?: string;
  groupTrackIndex?: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: "audio" | "video" | "image";
  clips: TimelineClip[];
  height: number;
}

export interface TimelineGroup {
  id: string;
  name: string;
  clipIds: string[];
  color: string;
  collapsed: boolean;
  trackId: string;
}

export interface TimelineState {
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  tracks: TimelineTrack[];
  groups: TimelineGroup[];
  isPlaying: boolean;
  totalDuration: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: "move" | "trim-start" | "trim-end" | "playhead" | null;
  clipId: string | null;
  selectedClipIds: string[];
  startX: number;
  startY: number;
  startTime: number;
  originalClips: TimelineClip[];
  targetTrackId: string | null;
  trackOffsets: Map<string, number>;
  isValidDrop: boolean;
  collisionDetected: boolean;
  dragStarted: boolean;
  showNewTrackIndicator: boolean;
}

export interface SnapState {
  isSnapping: boolean;
  snapPosition: number | null;
  snapType: "start" | "end" | "playhead" | null;
  targetClipId: string | null;
}

export interface RangeSelection {
  clipId: string;
  startOffset: number;
  endOffset: number;
}

export interface AudioTrackSegment {
  id: string;
  startTime: number;
  endTime: number;
  audioData: Float32Array;
  volume: number;
}

export interface InteractiveTrackEditorProps {
  onTimelineChange?: (state: TimelineState) => void;
} 