import { useState, useCallback } from 'react';
import InteractiveTrackEditor from './components/InteractiveTrackEditor';

interface TimelineState {
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  tracks: any[];
  isPlaying: boolean;
  totalDuration: number;
}

export default function App() {
  const [timelineState, setTimelineState] = useState<TimelineState | null>(null);
  const [, setLastAction] = useState<string>('Ready');

  const handleTimelineChange = useCallback((state: TimelineState) => {
    setTimelineState(state);
    
    // Update last action based on state changes
    if (state.selectedClips.length > 0) {
      setLastAction(`${state.selectedClips.length} selected`);
    } else if (state.isPlaying) {
      setLastAction('Playing');
    } else {
      setLastAction('Ready');
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (timelineState) {
      // const newZoom = Math.min(timelineState.zoomLevel * 1.2, 3);
      // This would ideally be handled by exposing zoom controls from InteractiveTrackEditor
      setLastAction('Zoom In');
    }
  }, [timelineState]);

  const handleZoomOut = useCallback(() => {
    if (timelineState) {
      // const newZoom = Math.max(timelineState.zoomLevel / 1.2, 0.5);
      // This would ideally be handled by exposing zoom controls from InteractiveTrackEditor
      setLastAction('Zoom Out');
    }
  }, [timelineState]);

  const handleZoomSlider = useCallback((value: number) => {
    // This would ideally be handled by exposing zoom controls from InteractiveTrackEditor
    setLastAction(`Zoom ${Math.round(value * 100)}%`);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <InteractiveTrackEditor 
          onTimelineChange={handleTimelineChange} 
        />
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-50 bg-[#0d0d0d] border border-[#2b2b2b] text-white px-4 py-3 rounded-lg shadow-lg p-[0px]">
          <div className="flex items-center gap-3">
            {/* Zoom Out Button */}
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-[#1a1a1a] hover:bg-[#333333] transition-colors duration-200 border border-[#2b2b2b]"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                  stroke="#FAFAFA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888888] min-w-[30px]">
                {timelineState ? `${Math.round(timelineState.zoomLevel * 100)}%` : '100%'}
              </span>
              <div className="relative w-24 h-4">
                <div className="absolute h-1 left-0 right-0 top-1/2 translate-y-[-50%]">
                  <div className="absolute bg-[#444444] h-1 left-0 right-0 rounded-full top-1/2 translate-y-[-50%]" />
                  <div 
                    className="absolute bg-neutral-50 h-1 left-0 rounded-full top-0"
                    style={{ 
                      width: timelineState 
                        ? `${((timelineState.zoomLevel - 0.5) / (3 - 0.5)) * 100}%` 
                        : '20%' 
                    }}
                  />
                </div>
                <div 
                  className="absolute flex items-center justify-center w-4 h-4 top-0 cursor-pointer"
                  style={{ 
                    left: timelineState 
                      ? `${((timelineState.zoomLevel - 0.5) / (3 - 0.5)) * 80}px` 
                      : '16px' 
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startZoom = timelineState?.zoomLevel || 1;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaX = e.clientX - startX;
                      const deltaZoom = (deltaX / 80) * (3 - 0.5); // 80px slider width, 0.5-3 zoom range
                      const newZoom = Math.max(0.5, Math.min(3, startZoom + deltaZoom));
                      handleZoomSlider(newZoom);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="bg-neutral-50 rounded-full w-4 h-4 shadow-sm border border-[#2b2b2b]" />
                </div>
              </div>
            </div>

            {/* Zoom In Button */}
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-[#1a1a1a] hover:bg-[#333333] transition-colors duration-200 border border-[#2b2b2b]"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 5.33333V10.6667M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                  stroke="#FAFAFA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}