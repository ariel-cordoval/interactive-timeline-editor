import React from 'react';
import { 
  TimelineClip, 
  TimelineGroup, 
  SnapState, 
  DragState, 
  RangeSelection 
} from '../types/timeline';

interface GroupTrackRowProps {
  group: TimelineGroup;
  clips: TimelineClip[];
  onGroupClick: (groupId: string, event: React.MouseEvent) => void;
  onGroupMouseDown: (groupId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  onClipClick: (clipId: string, event: React.MouseEvent) => void;
  onClipMouseDown: (clipId: string, event: React.MouseEvent, dragType: "move" | "trim-start" | "trim-end") => void;
  timeToPixel: (time: number) => number;
  zoomLevel: number;
  snapState: SnapState;
  dragState: DragState;
  selected: boolean;
  rangeSelection: RangeSelection | null;
  onRangeSelect: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onExpandGroup: (groupId: string) => void;
  onCollapseGroup: (groupId: string) => void;
}

const GroupTrackRow: React.FC<GroupTrackRowProps> = ({
  group,
  clips,
  onGroupClick,
  onGroupMouseDown,
  onClipClick,
  onClipMouseDown,
  timeToPixel,
  zoomLevel,
  snapState,
  dragState,
  selected,
  rangeSelection,
  onRangeSelect,
  onRangeSplit,
  onRangeDelete,
  onExpandGroup,
  onCollapseGroup,
}) => {
  // Calculate group bounds
  const groupStartTime = Math.min(...clips.map(c => c.startTime));
  const groupEndTime = Math.max(...clips.map(c => c.endTime));
  const groupDuration = groupEndTime - groupStartTime;
  const groupWidth = timeToPixel(groupDuration);
  
  const isBeingDragged = clips.some(clip => 
    dragState.selectedClipIds.includes(clip.id));

  // Generate consistent colors for speakers
  const getSpeakerColor = (clipName: string, clipColor?: string) => {
    if (clipColor) return clipColor;
    
    const colors = [
      '#E961FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
    ];
    
    let hash = 0;
    for (let i = 0; i < clipName.length; i++) {
      hash = clipName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate real combined waveform with speaker color coding
  const generateCombinedWaveform = () => {
    if (!clips.length) return [];
    
    const bars = [];
    const barCount = Math.max(20, Math.floor(groupWidth / 3));
    const segmentDuration = groupDuration / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const segmentTime = i * segmentDuration + groupStartTime;
      
      const activeClips = clips.filter(clip => {
        return segmentTime >= clip.startTime && segmentTime < clip.endTime;
      });
      
      const clipAmplitudes: Array<{
        clip: any;
        amplitude: number;
        color: string;
      }> = [];
      
      activeClips.forEach(clip => {
        if (clip.waveformData && clip.waveformData.length > 0) {
          const clipProgress = (segmentTime - clip.startTime) / clip.duration;
          const waveformIndex = Math.floor(clipProgress * clip.waveformData.length);
          if (waveformIndex >= 0 && waveformIndex < clip.waveformData.length) {
            const amplitude = clip.waveformData[waveformIndex];
            clipAmplitudes.push({
              clip,
              amplitude,
              color: getSpeakerColor(clip.name, clip.waveformColor)
            });
          }
        }
      });
      
      if (clipAmplitudes.length > 0) {
        const dominantSpeaker = clipAmplitudes.reduce((prev, current) => 
          current.amplitude > prev.amplitude ? current : prev
        );
        
        const totalAmplitude = clipAmplitudes.reduce((sum, item) => sum + item.amplitude, 0);
        const normalizedAmplitude = Math.min(1, totalAmplitude);
        const dominanceRatio = dominantSpeaker.amplitude / totalAmplitude;
        const barHeight = Math.max(2, normalizedAmplitude * 24);
        const opacity = 0.4 + (dominanceRatio * 0.6);
        
        bars.push({
          x: (i / barCount) * groupWidth,
          height: barHeight,
          opacity,
          color: dominantSpeaker.color,
          dominantSpeaker: dominantSpeaker.clip.name || 'Unknown'
        });
      } else {
        bars.push({
          x: (i / barCount) * groupWidth,
          height: 2,
          opacity: 0.2,
          color: '#666666',
          dominantSpeaker: ''
        });
      }
    }
    
    return bars;
  };

  const waveformBars = generateCombinedWaveform();

  // Render group as unified clip
  return (
    <div className="mb-1 h-[65px] relative select-none">
      <div
        className={`absolute top-0 h-full transition-all duration-200 select-none ${
          isBeingDragged ? "opacity-80" : ""
        }`}
        style={{
          left: `${timeToPixel(groupStartTime)}px`,
          width: `${groupWidth}px`,
          zIndex: selected ? 15 : 10,
        }}
        data-group-id={group.id}
      >
        {/* Unified Group - Styled like TimelineClip */}
        <div
          className={`
            relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
            ${selected ? 'ring-2 ring-[#E961FF] ring-opacity-50' : ''}
            ${isBeingDragged ? 'opacity-80 scale-[0.98]' : ''}
          `}
          style={{ width: `${groupWidth}px` }}
          data-group-id={group.id}
        >
          {/* Header Area - Click to select, drag when selected */}
          <div
            className={`
              h-6 relative transition-all duration-200 cursor-pointer
              ${selected ? 'bg-[#2b2b2b]' : 'bg-[#1d1d1d]'}
              hover:bg-[#2b2b2b]
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGroupClick(group.id, e);
            }}
            onMouseDown={(e) => {
              if (selected) {
                e.preventDefault();
                e.stopPropagation();
                onGroupMouseDown(group.id, e, "move");
              }
            }}
          >
            <div className="flex items-center gap-2 px-2 py-1">
              {/* Group Name */}
              <div className="flex-1 min-w-0">
                <p className="text-[#bbbbbb] text-[11px] font-semibold leading-[16px] truncate">
                  {group.name || 'Tracks group'}
                </p>
              </div>
              
              {/* Duration */}
              <div className="text-[#888888] text-[10px] shrink-0">
                {Math.floor(groupDuration)}s
              </div>
            </div>
          </div>

          {/* Content Area - Combined Waveform */}
          <div className="h-10 relative bg-[#1d1d1d] hover:bg-[#222222] transition-colors duration-150 mx-1">
            <div className="flex items-center h-full px-1 py-1">
              <div className="h-full relative w-full">
                <svg
                  className="w-full h-full"
                  viewBox={`0 0 ${groupWidth} 32`}
                  preserveAspectRatio="none"
                >
                  {waveformBars.map((bar: any, index: number) => {
                    const barY = (32 - bar.height) / 2;
                    return (
                      <rect
                        key={index}
                        x={bar.x}
                        y={barY}
                        width="2"
                        height={bar.height}
                        fill={bar.color || "#E961FF"}
                        opacity={bar.opacity}
                        data-speaker={bar.dominantSpeaker || ''}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Active Speaker Indicator */}
            {(() => {
              const recentBars = waveformBars.slice(-5);
              const activeSpeakers = recentBars
                .filter((bar: any) => bar.dominantSpeaker && bar.opacity > 0.5)
                .map((bar: any) => ({ name: bar.dominantSpeaker, color: bar.color }));
              
              if (activeSpeakers.length > 0) {
                const currentSpeaker = activeSpeakers[activeSpeakers.length - 1];
                return (
                  <div 
                    className="absolute top-1 right-2 px-2 py-0.5 rounded text-xs font-medium shadow-lg border"
                    style={{ 
                      backgroundColor: currentSpeaker.color + '20',
                      borderColor: currentSpeaker.color,
                      color: currentSpeaker.color
                    }}
                  >
                    🎤 {currentSpeaker.name}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupTrackRow; 