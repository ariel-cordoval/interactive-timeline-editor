import { useCallback, useRef, useState, useEffect } from 'react';

interface ZoomState {
  zoomLevel: number;
  viewportOffset: number; // Timeline offset to maintain cursor position
  isAnimating: boolean;
}

interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
  animationDuration: number;
  zoomStep: number;
  wheelSensitivity: number;
}

interface ZoomToPointOptions {
  clientX: number;
  containerRect: DOMRect;
  timelineWidth: number;
  totalDuration: number;
  smooth?: boolean;
}

const DEFAULT_CONFIG: ZoomConfig = {
  minZoom: 0.1, // Show entire project with padding
  maxZoom: 100, // Frame-level precision (assuming 30fps = ~0.033s per frame)
  animationDuration: 300, // 300ms for smooth transitions
  zoomStep: 1.2, // 20% increase per step
  wheelSensitivity: 0.002, // Sensitivity for wheel zoom
};

export const useSmoothZoom = (
  initialZoom: number = 1,
  totalDuration: number,
  config: Partial<ZoomConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [zoomState, setZoomState] = useState<ZoomState>({
    zoomLevel: initialZoom,
    viewportOffset: 0,
    isAnimating: false,
  });

  const animationRef = useRef<number | null>(null);
  const animationStartTime = useRef<number>(0);
  const animationStartZoom = useRef<number>(initialZoom);
  const animationTargetZoom = useRef<number>(initialZoom);
  const animationStartOffset = useRef<number>(0);
  const animationTargetOffset = useRef<number>(0);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Easing function for smooth transitions
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // Calculate zoom boundaries based on content
  const getZoomBoundaries = useCallback(() => {
    const minZoom = Math.max(finalConfig.minZoom, 0.1);
    const maxZoom = Math.min(finalConfig.maxZoom, 100);
    return { minZoom, maxZoom };
  }, [finalConfig.minZoom, finalConfig.maxZoom]);

  // Animate zoom changes
  const animateZoom = useCallback((targetZoom: number, targetOffset: number) => {
    const { minZoom, maxZoom } = getZoomBoundaries();
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
    
    animationStartTime.current = Date.now();
    animationStartZoom.current = zoomState.zoomLevel;
    animationTargetZoom.current = clampedZoom;
    animationStartOffset.current = zoomState.viewportOffset;
    animationTargetOffset.current = targetOffset;

    setZoomState(prev => ({ ...prev, isAnimating: true }));

    const animate = () => {
      const elapsed = Date.now() - animationStartTime.current;
      const progress = Math.min(elapsed / finalConfig.animationDuration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentZoom = animationStartZoom.current + 
        (animationTargetZoom.current - animationStartZoom.current) * easedProgress;
      const currentOffset = animationStartOffset.current + 
        (animationTargetOffset.current - animationStartOffset.current) * easedProgress;

      setZoomState({
        zoomLevel: currentZoom,
        viewportOffset: currentOffset,
        isAnimating: progress < 1,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [zoomState.zoomLevel, zoomState.viewportOffset, finalConfig.animationDuration, getZoomBoundaries]);

  // Zoom to a specific point (cursor position) - simplified version
  const zoomToPoint = useCallback((
    newZoom: number, 
    options: ZoomToPointOptions
  ) => {
    const { minZoom, maxZoom } = getZoomBoundaries();
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    const smooth = options.smooth !== false;

    if (smooth) {
      animateZoom(clampedZoom, 0); // Simplified - no viewport offset for now
    } else {
      setZoomState({
        zoomLevel: clampedZoom,
        viewportOffset: 0,
        isAnimating: false,
      });
    }
  }, [animateZoom, getZoomBoundaries]);

  // Zoom in/out with steps
  const zoomIn = useCallback((options?: Partial<ZoomToPointOptions>) => {
    const newZoom = zoomState.zoomLevel * finalConfig.zoomStep;
    if (options && options.clientX !== undefined && options.containerRect && options.timelineWidth) {
      zoomToPoint(newZoom, options as ZoomToPointOptions);
    } else {
      // Default zoom to center
      const timelineWidth = options?.timelineWidth || 1262;
      const centerX = timelineWidth / 2;
      zoomToPoint(newZoom, {
        clientX: centerX,
        containerRect: new DOMRect(0, 0, timelineWidth, 100),
        timelineWidth,
        totalDuration,
      });
    }
  }, [zoomState.zoomLevel, finalConfig.zoomStep, zoomToPoint, totalDuration]);

  const zoomOut = useCallback((options?: Partial<ZoomToPointOptions>) => {
    const newZoom = zoomState.zoomLevel / finalConfig.zoomStep;
    if (options && options.clientX !== undefined && options.containerRect && options.timelineWidth) {
      zoomToPoint(newZoom, options as ZoomToPointOptions);
    } else {
      // Default zoom to center
      const timelineWidth = options?.timelineWidth || 1262;
      const centerX = timelineWidth / 2;
      zoomToPoint(newZoom, {
        clientX: centerX,
        containerRect: new DOMRect(0, 0, timelineWidth, 100),
        timelineWidth,
        totalDuration,
      });
    }
  }, [zoomState.zoomLevel, finalConfig.zoomStep, zoomToPoint, totalDuration]);

  // Handle mouse wheel zoom
  const handleWheelZoom = useCallback((event: WheelEvent, options: ZoomToPointOptions) => {
    event.preventDefault();
    
    const delta = -event.deltaY * finalConfig.wheelSensitivity;
    const zoomMultiplier = Math.exp(delta);
    const newZoom = zoomState.zoomLevel * zoomMultiplier;
    
    zoomToPoint(newZoom, options);
  }, [zoomState.zoomLevel, finalConfig.wheelSensitivity, zoomToPoint]);

  // Set zoom level directly (for slider)
  const setZoomLevel = useCallback((newZoom: number, smooth: boolean = true) => {
    if (smooth) {
      animateZoom(newZoom, zoomState.viewportOffset);
    } else {
      setZoomState(prev => ({
        ...prev,
        zoomLevel: newZoom,
      }));
    }
  }, [animateZoom, zoomState.viewportOffset]);

  // Get current visible time range (simplified)
  const getVisibleTimeRange = useCallback(() => {
    const visibleDuration = totalDuration / zoomState.zoomLevel;
    return {
      startTime: 0,
      endTime: Math.min(totalDuration, visibleDuration),
      duration: visibleDuration,
    };
  }, [zoomState.zoomLevel, totalDuration]);

  // Convert time to pixel position (simplified)
  const timeToPixel = useCallback((time: number) => {
    const timelineWidth = 1262;
    const visibleDuration = totalDuration / zoomState.zoomLevel;
    return (time / visibleDuration) * timelineWidth;
  }, [zoomState.zoomLevel, totalDuration]);

  // Convert pixel position to time (simplified)
  const pixelToTime = useCallback((pixel: number) => {
    const timelineWidth = 1262;
    const visibleDuration = totalDuration / zoomState.zoomLevel;
    return (pixel / timelineWidth) * visibleDuration;
  }, [zoomState.zoomLevel, totalDuration]);

  return {
    // State
    zoomLevel: zoomState.zoomLevel,
    viewportOffset: zoomState.viewportOffset,
    isAnimating: zoomState.isAnimating,
    
    // Actions
    zoomIn,
    zoomOut,
    zoomToPoint,
    setZoomLevel,
    handleWheelZoom,
    
    // Utilities
    timeToPixel,
    pixelToTime,
    getVisibleTimeRange,
    getZoomBoundaries,
  };
}; 