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
  const [, setTimelineState] = useState<TimelineState | null>(null);
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



  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <InteractiveTrackEditor 
          onTimelineChange={handleTimelineChange} 
        />
      </div>
    </div>
  );
}