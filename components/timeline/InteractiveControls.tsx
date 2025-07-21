import React from "react";
import { TimelineState, RangeSelection } from "../types/timeline";
import GroupButton from "../../imports/Split-3-4833";

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
  timelineState: TimelineState;
  rangeSelection: RangeSelection | null;
  onRangeSplit: (clipId: string, startOffset: number, endOffset: number) => void;
  onRangeDelete: (clipId: string, startOffset: number, endOffset: number) => void;
  onClearRangeSelection: () => void;
}

export default function InteractiveControls({
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
  timelineState: _timelineState,
  rangeSelection,
  onRangeSplit,
  onRangeDelete,
  onClearRangeSelection,
}: InteractiveControlsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle split - use range split if available
  const handleSplitClick = () => {
    if (rangeSelection) {
      console.log(`✂️ Range split: ${rangeSelection.clipId} from ${rangeSelection.startOffset.toFixed(2)}s to ${rangeSelection.endOffset.toFixed(2)}s`);
      onRangeSplit(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
      onClearRangeSelection(); // Clear the range selection after split
    } else {
      onSplit();
    }
  };

  // Handle delete - use range delete if available
  const handleDeleteClick = () => {
    if (rangeSelection) {
      console.log(`🗑️ Range delete: ${rangeSelection.clipId} from ${rangeSelection.startOffset.toFixed(2)}s to ${rangeSelection.endOffset.toFixed(2)}s`);
      onRangeDelete(rangeSelection.clipId, rangeSelection.startOffset, rangeSelection.endOffset);
      onClearRangeSelection(); // Clear the range selection after delete
    } else {
      onDelete();
    }
  };

  return (
    <div className="relative h-[52px] bg-[#0d0d0d] border-b border-[#2b2b2b]">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-start px-4 py-2 relative size-full">
          {/* Actions */}
          <div className="basis-0 box-border content-stretch flex flex-row gap-2 grow items-center justify-start min-h-px min-w-px px-0 py-0.5 relative shrink-0">
            
            {/* Split Button */}
            <button
              className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer"
              onClick={handleSplitClick}
              title={
                rangeSelection
                  ? `Split range selection (${(rangeSelection.endOffset - rangeSelection.startOffset).toFixed(1)}s)`
                  : selectedClips.length > 0
                  ? "Split selected clips at playhead"
                  : "Split all clips at playhead"
              }
            >
              <div className="relative shrink-0 size-4">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M14.4 14H12.8C11.9163 14 11.2 13.2837 11.2 12.4V3.6C11.2 2.71634 11.9163 2 12.8 2H14.4M1.6 2H3.2C4.08366 2 4.8 2.71634 4.8 3.6V12.4C4.8 13.2837 4.08366 14 3.2 14H1.6M8 3.42324V4.87441M8 7.27441V8.72559M8 11.1256V12.5768"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </button>

            {/* Group Button - Only show when multiple clips selected */}
            {selectedClips.length > 1 &&
              !hasGroupedSelection && (
                <button
                  className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer"
                  onClick={onGroup}
                  title="Group selected clips"
                >
                  <GroupButton />
                </button>
              )}

            {/* Ungroup Button - Only show when grouped clips selected */}
            {hasGroupedSelection && (
              <button
                className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 hover:bg-[#333333] cursor-pointer bg-[rgba(120,72,255,0.49)] bg-opacity-20"
                onClick={onUngroup}
                title="Ungroup selected clips"
              >
                <GroupButton />
              </button>
            )}

            {/* Delete Button */}
            <button
              className={`box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8 transition-colors duration-200 ${
                selectedClips.length > 0 || rangeSelection
                  ? "hover:bg-red-600 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleDeleteClick}
              disabled={selectedClips.length === 0 && !rangeSelection}
              title={
                rangeSelection
                  ? `Delete range selection (${(rangeSelection.endOffset - rangeSelection.startOffset).toFixed(1)}s)`
                  : "Delete selected clips"
              }
            >
              <div className="relative shrink-0 size-4">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M6 2H10M2 4H14M12.6667 4L12.1991 11.0129C12.129 12.065 12.0939 12.5911 11.8667 12.99C11.6666 13.3412 11.3648 13.6235 11.0011 13.7998C10.588 14 10.0607 14 9.00623 14H6.99377C5.93927 14 5.41202 14 4.99889 13.7998C4.63517 13.6235 4.33339 13.3412 4.13332 12.99C3.90607 12.5911 3.871 12.065 3.80086 11.0129L3.33333 4"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Player Controls */}
          <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
            {/* Play/Pause Button */}
            <button
              className="relative shrink-0 size-8 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={onPlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 32 32"
              >
                <rect
                  fill="#2B2B2B"
                  height="32"
                  rx="16"
                  width="32"
                />
                {isPlaying ? (
                  <g>
                    <rect
                      x="11"
                      y="9"
                      width="3"
                      height="14"
                      fill="#FAFAFA"
                    />
                    <rect
                      x="18"
                      y="9"
                      width="3"
                      height="14"
                      fill="#FAFAFA"
                    />
                  </g>
                ) : (
                  <path
                    d="M21.625 14.0514C23.125 14.9175 23.125 17.0825 21.625 17.9486L14.875 21.8457C13.375 22.7117 11.5 21.6292 11.5 19.8971L11.5 12.1029C11.5 10.3708 13.375 9.2883 14.875 10.1543L21.625 14.0514Z"
                    fill="#FAFAFA"
                  />
                )}
              </svg>
            </button>

            {/* Time Display */}
            <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center px-4 py-2 relative rounded-lg shrink-0 w-[90px]">
              <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-left text-neutral-50 text-nowrap tracking-[0.2px]">
                <p className="leading-[20px] text-[12px] whitespace-pre">
                  <span>{formatTime(playheadPosition)}</span>
                  <span className="text-[#888888]"> / </span>
                  <span className="text-[#888888]">
                    {formatTime(totalDuration)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
            <div className="flex flex-row items-center justify-end relative size-full">
              <div className="box-border content-stretch flex flex-row gap-2 items-center justify-end pl-4 pr-0 py-0.5 relative w-full">
                <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-0 relative shrink-0">
                  {/* Zoom Out Button */}
                  <button
                    className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 hover:bg-[#333333] transition-colors duration-200"
                    onClick={onZoomOut}
                    title="Zoom out"
                  >
                    <div className="relative shrink-0 size-4">
                      <svg
                        className="block size-full"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                          stroke="#FAFAFA"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Zoom Slider */}
                  <div className="h-4 relative shrink-0 w-[100px]">
                    <div className="absolute h-1 left-0 right-0 top-1/2 translate-y-[-50%]">
                      <div className="absolute bg-[#444444] h-1 left-0 right-0 rounded-[100px] top-1/2 translate-y-[-50%]" />
                      <div
                        className="absolute bg-neutral-50 h-1 left-0 rounded-[100px] top-0"
                        style={{
                          width: `${(zoomLevel - 0.5) * 100}px`,
                        }}
                      />
                    </div>
                    <div
                      className="absolute flex items-center justify-center size-4 top-0 cursor-pointer"
                      style={{
                        left: `${(zoomLevel - 0.5) * 84}px`,
                      }}
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startZoom = zoomLevel;

                        const handleMouseMove = (
                          e: MouseEvent,
                        ) => {
                          const deltaX = e.clientX - startX;
                          const deltaZoom = deltaX / 84;
                          const newZoom = Math.max(
                            0.5,
                            Math.min(
                              2.5,
                              startZoom + deltaZoom,
                            ),
                          );
                          onZoomSlider(newZoom);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                        };

                        document.addEventListener(
                          "mousemove",
                          handleMouseMove,
                        );
                        document.addEventListener(
                          "mouseup",
                          handleMouseUp,
                        );
                      }}
                    >
                      <div className="bg-neutral-50 rounded-[49px] size-4" />
                    </div>
                  </div>

                  {/* Zoom In Button */}
                  <button
                    className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 hover:bg-[#333333] transition-colors duration-200"
                    onClick={onZoomIn}
                    title="Zoom in"
                  >
                    <div className="relative shrink-0 size-4">
                      <svg
                        className="block size-full"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M8 5.33333V10.6667M5.33333 8H10.6667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
                          stroke="#FAFAFA"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 