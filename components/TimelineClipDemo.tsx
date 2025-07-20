import { useState } from 'react';
import TimelineClip from './TimelineClip';

interface ClipData {
  id: string;
  fileName: string;
  duration: number;
  startTime: number;
  width: number;
  thumbnail?: string;
}

export default function TimelineClipDemo() {
  const [clips, setClips] = useState<ClipData[]>([
    {
      id: 'clip-1',
      fileName: 'Kendall_Interview.mp4',
      duration: 15.5,
      startTime: 0,
      width: 400,
    },
    {
      id: 'clip-2',
      fileName: 'Stephen_Response.mp4',
      duration: 8.2,
      startTime: 450,
      width: 250,
    },
    {
      id: 'clip-3',
      fileName: 'Background_Music.mp3',
      duration: 30.0,
      startTime: 200,
      width: 600,
    },
  ]);

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('Ready');

  const handleClipDrag = (clipId: string, newPosition: number) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? { ...clip, startTime: newPosition }
        : clip
    ));
    setLastAction(`Moved ${clipId} to ${newPosition.toFixed(1)}s`);
  };

  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
    setLastAction(`Selected ${clipId}`);
  };

  const handleRangeSelect = (clipId: string, startOffset: number, endOffset: number) => {
    const duration = endOffset - startOffset;
    setLastAction(`Selected ${duration.toFixed(1)}s range in ${clipId}`);
  };

  const handleClipSplit = (clipId: string, splitPoint: number) => {
    const clipToSplit = clips.find(c => c.id === clipId);
    if (!clipToSplit) return;

    const newClips = clips.filter(c => c.id !== clipId);
    const leftClip: ClipData = {
      ...clipToSplit,
      id: `${clipId}-left`,
      fileName: `${clipToSplit.fileName.split('.')[0]}_part1.${clipToSplit.fileName.split('.')[1]}`,
      duration: splitPoint,
      width: (clipToSplit.width * splitPoint) / clipToSplit.duration,
    };
    const rightClip: ClipData = {
      ...clipToSplit,
      id: `${clipId}-right`,
      fileName: `${clipToSplit.fileName.split('.')[0]}_part2.${clipToSplit.fileName.split('.')[1]}`,
      duration: clipToSplit.duration - splitPoint,
      startTime: clipToSplit.startTime + splitPoint * 10, // Approximate timeline scale
      width: clipToSplit.width - leftClip.width,
    };

    setClips([...newClips, leftClip, rightClip]);
    setLastAction(`Split ${clipId} at ${splitPoint.toFixed(1)}s`);
    setSelectedClipId(null);
  };

  const handleClipDelete = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    setLastAction(`Deleted ${clipId}`);
    setSelectedClipId(null);
  };

  const addNewClip = () => {
    const newClip: ClipData = {
      id: `clip-${Date.now()}`,
      fileName: `New_Clip_${clips.length + 1}.mp4`,
      duration: 10,
      startTime: Math.max(...clips.map(c => c.startTime + 100)) + 50,
      width: 300,
    };
    setClips([...clips, newClip]);
    setLastAction(`Added ${newClip.id}`);
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-[#0d0d0d] border-b border-[#2b2b2b] p-4">
        <h1 className="text-white text-xl font-semibold mb-2">Timeline Clip Demo</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={addNewClip}
            className="px-4 py-2 bg-[#E961FF] text-white rounded-md hover:bg-[#d147e6] transition-colors"
          >
            Add Clip
          </button>
          <div className="text-[#bbbbbb] text-sm">
            Last Action: <span className="text-[#E961FF]">{lastAction}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#1a1a1a] border-b border-[#2b2b2b] p-4">
        <div className="text-[#bbbbbb] text-sm space-y-1">
          <p><strong className="text-white">Instructions:</strong></p>
          <p>• <strong>Header:</strong> Drag to move clips along timeline</p>
          <p>• <strong>Content:</strong> Click and drag to select ranges within clips</p>
          <p>• <strong>Keyboard:</strong> Delete/Backspace to delete, Cmd/Ctrl+S to split</p>
          <p>• <strong>Trim:</strong> Hover over edges when selected to resize</p>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 overflow-auto bg-[#161616] p-4">
        <div className="relative min-w-[1200px] h-full">
          {/* Timeline ruler */}
          <div className="mb-4 h-8 border-b border-[#2b2b2b] relative">
            {Array.from({ length: 21 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex flex-col justify-end"
                style={{ left: `${i * 60}px` }}
              >
                <div className="w-px h-2 bg-[#666666]" />
                <span className="text-[#888888] text-xs mt-1">
                  {i * 5}s
                </span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="space-y-4">
            {/* Video Track */}
            <div className="min-h-[80px] border-l-2 border-[#E961FF] pl-4 relative">
              <div className="text-[#bbbbbb] text-sm mb-2 font-medium">Video Track</div>
              <div className="relative h-[60px]">
                {clips
                  .filter(clip => clip.fileName.includes('.mp4'))
                  .map(clip => (
                    <div
                      key={clip.id}
                      className="absolute top-0"
                      style={{ left: `${clip.startTime}px` }}
                    >
                      <TimelineClip
                        {...clip}
                        selected={selectedClipId === clip.id}
                        onClipDrag={handleClipDrag}
                        onClipSelect={handleClipSelect}
                        onRangeSelect={handleRangeSelect}
                        onClipSplit={handleClipSplit}
                        onClipDelete={handleClipDelete}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Audio Track */}
            <div className="min-h-[80px] border-l-2 border-[#4CAF50] pl-4 relative">
              <div className="text-[#bbbbbb] text-sm mb-2 font-medium">Audio Track</div>
              <div className="relative h-[60px]">
                {clips
                  .filter(clip => clip.fileName.includes('.mp3'))
                  .map(clip => (
                    <div
                      key={clip.id}
                      className="absolute top-0"
                      style={{ left: `${clip.startTime}px` }}
                    >
                      <TimelineClip
                        {...clip}
                        selected={selectedClipId === clip.id}
                        onClipDrag={handleClipDrag}
                        onClipSelect={handleClipSelect}
                        onRangeSelect={handleRangeSelect}
                        onClipSplit={handleClipSplit}
                        onClipDelete={handleClipDelete}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-white pointer-events-none" style={{ left: '200px' }}>
            <div className="absolute top-0 w-3 h-3 bg-white transform -translate-x-1/2 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0d0d0d] border-t border-[#2b2b2b] p-4">
        <div className="text-[#888888] text-xs text-center">
          Selected: {selectedClipId || 'None'} | Total Clips: {clips.length}
        </div>
      </div>
    </div>
  );
} 