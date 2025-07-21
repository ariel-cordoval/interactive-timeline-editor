import { useState, useCallback } from 'react';

// Define drag-related types
interface DragState {
  isDragging: boolean;
  dragType: "move" | "trim-start" | "trim-end" | "playhead" | null;
  clipId: string | null;
  selectedClipIds: string[];
  startX: number;
  startY: number;
  startTime: number;
  originalClips: any[];
  targetTrackId: string | null;
  trackOffsets: Map<string, number>;
  isValidDrop: boolean;
  collisionDetected: boolean;
  dragStarted: boolean;
  showNewTrackIndicator: boolean;
}

interface SnapState {
  isSnapping: boolean;
  snapPosition: number | null;
  snapType: "start" | "end" | "playhead" | null;
  targetClipId: string | null;
}

interface MouseDownState {
  isMouseDown: boolean;
  startX: number;
  startY: number;
  startTime: number;
  clipId: string | null;
  dragType: "move" | "trim-start" | "trim-end" | null;
}

export const useDragOperations = () => {
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

  const [mouseDownState, setMouseDownState] = useState<MouseDownState>({
    isMouseDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    clipId: null,
    dragType: null,
  });

  // Drag control functions
  const startDrag = useCallback((
    clipId: string,
    dragType: "move" | "trim-start" | "trim-end" | "playhead",
    startX: number,
    startY: number,
    startTime: number,
    selectedClipIds: string[] = [],
    originalClips: any[] = []
  ) => {
    setDragState({
      isDragging: true,
      dragType,
      clipId,
      selectedClipIds,
      startX,
      startY,
      startTime,
      originalClips,
      targetTrackId: null,
      trackOffsets: new Map(),
      isValidDrop: true,
      collisionDetected: false,
      dragStarted: true,
      showNewTrackIndicator: false,
    });
  }, []);

  const updateDragState = useCallback((updates: Partial<DragState>) => {
    setDragState(prev => ({ ...prev, ...updates }));
  }, []);

  const endDrag = useCallback(() => {
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
  }, []);

  const updateSnapState = useCallback((snap: Partial<SnapState>) => {
    setSnapState(prev => ({ ...prev, ...snap }));
  }, []);

  const clearSnap = useCallback(() => {
    setSnapState({
      isSnapping: false,
      snapPosition: null,
      snapType: null,
      targetClipId: null,
    });
  }, []);

  const setMouseDown = useCallback((
    startX: number,
    startY: number,
    clipId: string,
    dragType: "move" | "trim-start" | "trim-end"
  ) => {
    setMouseDownState({
      isMouseDown: true,
      startX,
      startY,
      startTime: Date.now(),
      clipId,
      dragType,
    });
  }, []);

  const clearMouseDown = useCallback(() => {
    setMouseDownState({
      isMouseDown: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      clipId: null,
      dragType: null,
    });
  }, []);

  return {
    dragState,
    snapState,
    mouseDownState,
    setDragState,
    setSnapState,
    setMouseDownState,
    startDrag,
    updateDragState,
    endDrag,
    updateSnapState,
    clearSnap,
    setMouseDown,
    clearMouseDown,
  };
}; 