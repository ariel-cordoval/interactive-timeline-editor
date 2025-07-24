import React from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Scissors, 
  Trash2, 
  Group, 
  Ungroup 
} from 'lucide-react';
import { RangeSelection } from '../types/timeline';

interface InteractiveControlsProps {
  onSplit: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onPlayPause: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSlider: (value: number) => void;
  playheadPosition: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedClips: string[];
  zoomLevel: number;
  hasGroupedSelection: boolean;
  rangeSelection: RangeSelection | null;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onClearRangeSelection: () => void;
  onCopy: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  hasClipboardData: boolean;
}

const InteractiveControls: React.FC<InteractiveControlsProps> = ({
  onSplit,
  onDelete,
  onGroup,
  onUngroup,
  onPlayPause,
  onZoomIn,
  onZoomOut,
  onZoomSlider,
  playheadPosition,
  totalDuration,
  isPlaying,
  selectedClips,
  zoomLevel,
  hasGroupedSelection,
  rangeSelection,
  onRangeSplit,
  onRangeDelete,
  onClearRangeSelection,
  onCopy,
  onPaste,
  onDuplicate,
  hasClipboardData
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRangeSplit = () => {
    if (rangeSelection) {
      onRangeSplit(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
    }
  };

  const handleRangeDelete = () => {
    if (rangeSelection) {
      onRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
    }
  };

  return (
    <div className="h-[50px] bg-[#1a1a1a] border-b border-[#2b2b2b] flex items-center px-4 gap-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPlayPause}
          className="h-8 w-8 p-0 text-white hover:bg-[#2a2a2a]"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="text-xs text-[#888888] min-w-[60px]">
          {formatTime(playheadPosition)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[#2b2b2b]" />

      {/* Editing Controls */}
      <div className="flex items-center gap-2">
        {rangeSelection ? (
          // Range selection controls
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRangeSplit}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
              title="Split selection (Cmd+S)"
            >
              <Scissors className="h-3 w-3 mr-1" />
              Split Range
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRangeDelete}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
              title="Delete selection (Delete)"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Range
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
              title="Copy selection (Cmd+C)"
              disabled={!onCopy}
            >
              📋 Copy
            </Button>
            
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
                title="Duplicate selection (Cmd+D)"
              >
                📋+ Duplicate
              </Button>
            )}
            
            {hasClipboardData && onPaste && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPaste}
                className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
                title="Paste (Cmd+V)"
              >
                📄 Paste
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRangeSelection}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
              title="Clear selection (Esc)"
            >
              Clear
            </Button>
            
            <div className="text-xs text-[#888888]">
              Range: {rangeSelection.startOffset.toFixed(2)}s - {rangeSelection.endOffset.toFixed(2)}s
            </div>
          </>
        ) : (
          // Regular clip controls
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSplit}
              disabled={selectedClips.length === 0}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] disabled:opacity-50 text-xs"
              title="Split clips (Cmd+S)"
            >
              <Scissors className="h-3 w-3 mr-1" />
              Split
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={selectedClips.length === 0}
              className="h-8 px-3 text-white hover:bg-[#2a2a2a] disabled:opacity-50 text-xs"
              title="Delete clips (Delete)"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            
            {hasGroupedSelection ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUngroup}
                className="h-8 px-3 text-white hover:bg-[#2a2a2a] text-xs"
                title="Ungroup clips (Cmd+G)"
              >
                <Ungroup className="h-3 w-3 mr-1" />
                Ungroup
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGroup}
                disabled={selectedClips.length < 2}
                className="h-8 px-3 text-white hover:bg-[#2a2a2a] disabled:opacity-50 text-xs"
                title="Group clips (Cmd+G)"
              >
                <Group className="h-3 w-3 mr-1" />
                Group
              </Button>
            )}
            
            {selectedClips.length > 0 && (
              <div className="text-xs text-[#888888]">
                {selectedClips.length} selected
              </div>
            )}
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          className="h-8 w-8 p-0 text-white hover:bg-[#2a2a2a]"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="w-24">
          <Slider
            value={[zoomLevel]}
            onValueChange={(value: number[]) => onZoomSlider(value[0])}
            min={0.5}
            max={2.5}
            step={0.25}
            className="cursor-pointer"
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          className="h-8 w-8 p-0 text-white hover:bg-[#2a2a2a]"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="text-xs text-[#888888] min-w-[35px]">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};

export default InteractiveControls; 