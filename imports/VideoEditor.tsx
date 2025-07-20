import svgPaths from "./svg-ztnho4ek16";
// import imgThumbnail from "figma:asset/4306b5000124acacaee4b055aff5d35e0f9175e4.png";
// import imgThumbnail1 from "figma:asset/1ebb3f4353b4f56d3af35777ae05118d74c44374.png";
// import imgThumbnail2 from "figma:asset/77d69cf518a8647bd5380ca25978db6820a92bde.png";
// import imgThumbnail3 from "figma:asset/9c9a637b282e63dce6dafdfcbef493be633b83b2.png";
// import imgThumbnail4 from "figma:asset/f882e7984bc705d3269afdcdaff4a8d8b355f6db.png";

function NavigationHeader() {
  return (
    <div
      className="bg-[#0d0d0d] h-[52px] relative shrink-0 w-[1366px]"
      data-name="Navigation Header"
    >
      <div className="absolute border-[#222222] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Transcript() {
  return (
    <div
      className="bg-[#0d0d0d] h-full relative shrink-0 w-[548px]"
      data-name="Transcript"
    >
      <div className="absolute border-[#222222] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Player() {
  return (
    <div
      className="aspect-[1920/1080] basis-0 bg-[#1d1d1d] grow min-h-px min-w-px shrink-0"
      data-name="Player"
    />
  );
}

function CanvasArea() {
  return (
    <div
      className="basis-0 grow h-full min-h-px min-w-px relative shrink-0"
      data-name="Canvas area"
    >
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center pb-10 pt-5 px-5 relative size-full">
          <Player />
        </div>
      </div>
    </div>
  );
}

function TranscriptCanvas() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0 w-full"
      data-name="Transcript + Canvas"
    >
      <Transcript />
      <CanvasArea />
    </div>
  );
}

function EditorCursor02() {
  return (
    <div className="relative shrink-0 size-4" data-name="Editor/cursor-02">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Editor/cursor-02">
          <path
            d={svgPaths.p39d0fa00}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function ArrowsChevronDown() {
  return (
    <div className="relative shrink-0 size-3" data-name="Arrows/chevron-down">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 12 12"
      >
        <g id="Arrows/chevron-down">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function CursorSelector() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-[3px] h-8 items-center justify-center p-[6px] relative rounded-lg shrink-0"
      data-name="Cursor selector"
    >
      <EditorCursor02 />
      <ArrowsChevronDown />
    </div>
  );
}

function Split() {
  return (
    <div className="relative shrink-0 size-4" data-name="Split">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Split">
          <path
            d={svgPaths.pc385460}
            id="Vector"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Split1() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8"
      data-name="Split"
    >
      <Split />
    </div>
  );
}

function MediaDevicesVolumeMax() {
  return (
    <div
      className="relative shrink-0 size-4"
      data-name="Media & devices/volume-max"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Media & devices/volume-max">
          <path
            d={svgPaths.p2d6bcb00}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function VolumeControls() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8"
      data-name="Volume controls"
    >
      <MediaDevicesVolumeMax />
    </div>
  );
}

function GeneralTrash04() {
  return (
    <div className="relative shrink-0 size-4" data-name="General/trash-04">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="General/trash-04">
          <path
            d={svgPaths.p264e0480}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Delete() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8"
      data-name="Delete"
    >
      <GeneralTrash04 />
    </div>
  );
}

function Actions() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row gap-2 grow items-center justify-start min-h-px min-w-px px-0 py-0.5 relative shrink-0"
      data-name="Actions"
    >
      <CursorSelector />
      <div className="flex h-[24px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-6" data-name="Divider">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 24 1"
              >
                <line
                  id="Divider"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="24"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Split1 />
      <VolumeControls />
      <Delete />
    </div>
  );
}

function PlayButton() {
  return (
    <div className="relative shrink-0 size-8" data-name="Play button">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 32 32"
      >
        <g id="Play button">
          <rect fill="var(--fill-0, #2B2B2B)" height="32" rx="16" width="32" />
          <path
            d={svgPaths.p268e6f00}
            fill="var(--fill-0, #FAFAFA)"
            id="Polygon 1"
          />
        </g>
      </svg>
    </div>
  );
}

function ButtonText() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center px-4 py-2 relative rounded-lg shrink-0 w-[90px]"
      data-name="Button Text"
    >
      <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-left text-neutral-50 text-nowrap tracking-[0.2px]">
        <p className="leading-[20px] text-[12px] whitespace-pre">
          <span>{`00:05 `}</span>
          <span className="text-[#888888]">/</span>
          <span className="adjustLetterSpacing text-[#888888]">45:00</span>
        </p>
      </div>
    </div>
  );
}

function Player1() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0"
      data-name="Player"
    >
      <PlayButton />
      <ButtonText />
    </div>
  );
}

function GeneralMinusCircle() {
  return (
    <div className="relative shrink-0 size-4" data-name="General/minus-circle">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="General/minus-circle">
          <path
            d={svgPaths.p347d4000}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function IconButton() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0"
      data-name="Icon Button"
    >
      <GeneralMinusCircle />
    </div>
  );
}

function Frame67241() {
  return (
    <div className="absolute h-1 left-0 right-0 top-1/2 translate-y-[-50%]">
      <div className="absolute bg-[#444444] h-1 left-0 right-0 rounded-[100px] top-1/2 translate-y-[-50%]" />
      <div className="absolute bg-neutral-50 h-1 left-0 rounded-[100px] top-0 w-[50px]" />
    </div>
  );
}

function Nob() {
  return (
    <div className="bg-neutral-50 rounded-[49px] size-4" data-name="Nob" />
  );
}

function Frame67242() {
  return (
    <div className="h-4 relative shrink-0 w-[100px]">
      <Frame67241 />
      <div className="absolute flex items-center justify-center left-[42px] size-4 top-0">
        <div className="flex-none rotate-[180deg]">
          <Nob />
        </div>
      </div>
    </div>
  );
}

function GeneralPlusCircle() {
  return (
    <div className="relative shrink-0 size-4" data-name="General/plus-circle">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="General/plus-circle">
          <path
            d={svgPaths.p158e2900}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function IconButton1() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0"
      data-name="Icon Button"
    >
      <GeneralPlusCircle />
    </div>
  );
}

function Zoom() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-0 relative shrink-0"
      data-name="Zoom"
    >
      <IconButton />
      <Frame67242 />
      <IconButton1 />
    </div>
  );
}

function TimelineDown() {
  return (
    <div className="relative shrink-0 size-4" data-name="Timeline-down">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Timeline-down">
          <path
            d={svgPaths.p2e49de00}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function MinimizeTimeline() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative rounded-lg shrink-0 size-8"
      data-name="Minimize timeline"
    >
      <TimelineDown />
    </div>
  );
}

function TimelineControls() {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0"
      data-name="Timeline controls"
    >
      <div className="flex flex-row items-center justify-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-end pl-4 pr-0 py-0.5 relative w-full">
          <Zoom />
          <MinimizeTimeline />
        </div>
      </div>
    </div>
  );
}

function Controls() {
  return (
    <div className="relative shrink-0 w-full" data-name="Controls">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-start px-4 py-2 relative w-full">
          <Actions />
          <Player1 />
          <TimelineControls />
        </div>
      </div>
      <div className="absolute border-[0px_0px_1px] border-[rgba(43,43,43,0)] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function FrameMarkers() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full"
      data-name="Frame markers"
    >
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 32 32"
            >
              <line
                id="Line 50"
                opacity="0"
                stroke="var(--stroke-0, #2B2B2B)"
                x2="3"
                y1="-0.5"
                y2="-0.5"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 3 1"
              >
                <line
                  id="Line 60"
                  stroke="var(--stroke-0, #2B2B2B)"
                  x2="3"
                  y1="0.5"
                  y2="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[3px] items-center justify-center relative shrink-0 w-[0px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[3px]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 32 32"
            >
              <line
                id="Line 50"
                opacity="0"
                stroke="var(--stroke-0, #2B2B2B)"
                x2="3"
                y1="-0.5"
                y2="-0.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeframe() {
  return (
    <div className="relative shrink-0 w-[142px]" data-name="Timeframe">
      <div className="box-border content-stretch flex flex-col items-start justify-center overflow-clip pl-2 pr-0 py-0 relative w-[142px]">
        <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium h-6 justify-center leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#555555] text-[10px] text-left text-nowrap tracking-[0.2px] w-full">
          <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
            00:00
          </p>
        </div>
        <FrameMarkers />
      </div>
      <div className="absolute border-[#2b2b2b] border-[0px_0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Timeframes() {
  return (
    <div className="relative shrink-0 w-full" data-name="Timeframes">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-row items-start justify-start pl-10 pr-0 py-0 relative w-full">
          {[...Array(9).keys()].map((_, i) => (
            <Timeframe key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneralPlus() {
  return (
    <div className="relative shrink-0 size-5" data-name="General/plus">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 20 20"
      >
        <g id="General/plus">
          <path
            d={svgPaths.p3e0d5c80}
            id="Icon"
            stroke="var(--stroke-0, #FAFAFA)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function AddButton() {
  return (
    <div
      className="basis-0 bg-[#222222] box-border content-stretch flex flex-row gap-2 grow items-center justify-center min-h-px min-w-px p-[12px] relative rounded-lg shrink-0 w-8"
      data-name="Add button"
    >
      <GeneralPlus />
    </div>
  );
}

function AddContent() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-3 items-center justify-center p-0 relative shrink-0 size-10"
      data-name="Add Content"
    >
      <AddButton />
    </div>
  );
}

function Scene() {
  return (
    <div
      className="bg-[#222222] box-border content-stretch flex flex-row-reverse h-10 items-center justify-start pb-1 pt-[5px] px-1 relative rounded shrink-0 w-20"
      data-name="Scene"
    >
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded" />
      <div
        className="aspect-[1920/1080] bg-center bg-cover bg-no-repeat h-full order-1 rounded-sm shrink-0 bg-gray-600"
        data-name="Thumbnail"
        // style={{ backgroundImage: `url('${imgThumbnail}')` }}
      />
    </div>
  );
}

function Scene1() {
  return (
    <div
      className="bg-[#222222] box-border content-stretch flex flex-row-reverse h-10 items-center justify-start pb-1 pt-[5px] px-1 relative rounded shrink-0 w-[510px]"
      data-name="Scene"
    >
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded" />
      <div
        className="aspect-[1920/1080] bg-center bg-cover bg-no-repeat h-full order-1 rounded-sm shrink-0 bg-gray-600"
        data-name="Thumbnail"
        // style={{ backgroundImage: `url('${imgThumbnail}')` }}
      />
    </div>
  );
}

function Scene2() {
  return (
    <div
      className="bg-[#222222] box-border content-stretch flex flex-row-reverse h-10 items-center justify-start pb-1 pt-[5px] px-1 relative rounded shrink-0 w-[389px]"
      data-name="Scene"
    >
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded" />
      <div
        className="aspect-[1920/1080] bg-center bg-cover bg-no-repeat h-full order-1 rounded-sm shrink-0 bg-gray-600"
        data-name="Thumbnail"
        // style={{ backgroundImage: `url('${imgThumbnail}')` }}
      />
    </div>
  );
}

function ScenesContainer() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-0.5 items-start justify-start pb-3 pt-4 px-0 relative shrink-0 w-full"
      data-name="Scenes container"
    >
      <AddContent />
      <Scene />
      <Scene1 />
      <Scene2 />
      <Scene />
      <AddContent />
    </div>
  );
}

function Top() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <div
            className="bg-center bg-contain bg-no-repeat h-4 rounded-sm shrink-0 w-7"
            data-name="Thumbnail"
            // style={{ backgroundImage: `url('${imgThumbnail1}')` }}
          />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audiowaves() {
  return (
    <div
      className="bg-[#1d1d1d] box-border content-stretch flex flex-row h-10 items-center justify-start overflow-clip px-0 py-1 relative rounded-[7px] shrink-0 w-full"
      data-name="Audiowaves"
    >
      <div
        className="h-full relative shrink-0 w-[205px]"
        data-name="Stephen 05"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 205 32"
        >
          <g id="Stephen 05">
            <path d={svgPaths.p3d037800} fill="var(--fill-0, #555555)" />
            <path d={svgPaths.p11a62900} fill="var(--fill-0, #555555)" />
          </g>
        </svg>
      </div>
      <div
        className="h-full relative shrink-0 w-[103px]"
        data-name="Kendall 05"
      >
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Kendall 04"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2f0b5c0}
              fill="var(--fill-0, #555555)"
              id="Kendall 04"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 6">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[81px]" data-name="Kendall 02">
        <div className="absolute bottom-[0.818%] left-0 right-0 top-[0.818%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 81 32"
          >
            <path
              d={svgPaths.pef34dc0}
              fill="var(--fill-0, #555555)"
              id="Kendall 02"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 01"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 7">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[103px]" data-name="Kendall 6">
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[104px]" data-name="Stephen 8">
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 9">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 10"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Track() {
  return (
    <div
      className="bg-[#2b2b2b] relative rounded-lg shrink-0 w-[79px]"
      data-name="Track"
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip pb-px pt-0 px-px relative w-[79px]">
        <Top />
        <Audiowaves />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function GroupIcon() {
  return (
    <div className="relative shrink-0 size-4" data-name="Group Icon">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Group Icon">
          <path
            d={svgPaths.p3aaa9400}
            id="Icon"
            stroke="var(--stroke-0, #BBBBBB)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Header() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <GroupIcon />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Tracks group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Top1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <div
            className="bg-center bg-cover bg-no-repeat h-4 rounded-sm shrink-0 w-7"
            data-name="Thumbnail"
            // style={{ backgroundImage: `url('${imgThumbnail2}')` }}
          />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audiowaves1() {
  return (
    <div
      className="bg-[#1d1d1d] box-border content-stretch flex flex-row h-10 items-center justify-start overflow-clip px-0 py-1 relative rounded-[7px] shrink-0 w-full"
      data-name="Audiowaves"
    >
      <div
        className="h-full relative shrink-0 w-[205px]"
        data-name="Stephen 05"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 205 32"
        >
          <g id="Stephen 05">
            <path d={svgPaths.p3d037800} fill="var(--fill-0, #C2FF44)" />
            <path d={svgPaths.p11a62900} fill="var(--fill-0, #C2FF44)" />
          </g>
        </svg>
      </div>
      <div
        className="h-full relative shrink-0 w-[103px]"
        data-name="Kendall 05"
      >
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #C2FF44)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Kendall 04"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2f0b5c0}
              fill="var(--fill-0, #C2FF44)"
              id="Kendall 04"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 6">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[81px]" data-name="Kendall 02">
        <div className="absolute bottom-[0.818%] left-0 right-0 top-[0.818%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 81 32"
          >
            <path
              d={svgPaths.pef34dc0}
              fill="var(--fill-0, #C2FF44)"
              id="Kendall 02"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 01"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 7">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[103px]" data-name="Kendall 6">
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #C2FF44)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[104px]" data-name="Stephen 8">
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 9">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 10"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #C2FF44)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Track1() {
  return (
    <div
      className="absolute bg-[#2b2b2b] h-[65px] left-0 right-0 rounded-lg top-1/2 translate-y-[-50%]"
      data-name="Track"
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip pb-px pt-0 px-px relative size-full">
        <Top1 />
        <Audiowaves1 />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function TrackRail() {
  return (
    <div
      className="bg-[#151515] h-[65px] relative rounded-lg shrink-0 w-full"
      data-name="Track rail"
    >
      <Track1 />
    </div>
  );
}

function Top2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <div
            className="bg-center bg-cover bg-no-repeat h-4 rounded-sm shrink-0 w-7 bg-gray-600"
            data-name="Thumbnail"
            // style={{ backgroundImage: `url('${imgThumbnail}')` }}
          />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audiowaves2() {
  return (
    <div
      className="bg-[#1d1d1d] box-border content-stretch flex flex-row h-10 items-center justify-start overflow-clip px-0 py-1 relative rounded-[7px] shrink-0 w-full"
      data-name="Audiowaves"
    >
      <div
        className="h-full relative shrink-0 w-[205px]"
        data-name="Stephen 05"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 205 32"
        >
          <g id="Stephen 05">
            <path d={svgPaths.p3d037800} fill="var(--fill-0, #E961FF)" />
            <path d={svgPaths.p11a62900} fill="var(--fill-0, #E961FF)" />
          </g>
        </svg>
      </div>
      <div
        className="h-full relative shrink-0 w-[103px]"
        data-name="Kendall 05"
      >
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #E961FF)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Kendall 04"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2f0b5c0}
              fill="var(--fill-0, #E961FF)"
              id="Kendall 04"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 6">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[81px]" data-name="Kendall 02">
        <div className="absolute bottom-[0.818%] left-0 right-0 top-[0.818%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 81 32"
          >
            <path
              d={svgPaths.pef34dc0}
              fill="var(--fill-0, #E961FF)"
              id="Kendall 02"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 01"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 7">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[103px]" data-name="Kendall 6">
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #E961FF)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[104px]" data-name="Stephen 8">
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 9">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 10"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #E961FF)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Track2() {
  return (
    <div
      className="absolute bg-[#2b2b2b] left-0 right-0 rounded-lg top-1/2 translate-y-[-50%]"
      data-name="Track"
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip pb-px pt-0 px-px relative w-full">
        <Top2 />
        <Audiowaves2 />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function TrackRail1() {
  return (
    <div
      className="bg-[#151515] h-[65px] relative rounded-lg shrink-0 w-full"
      data-name="Track rail"
    >
      <Track2 />
    </div>
  );
}

function Top3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <div
            className="bg-center bg-cover bg-no-repeat h-4 rounded-sm shrink-0 w-7"
            data-name="Thumbnail"
            style={{
              // backgroundImage: `url('${imgThumbnail3}'), url('${imgThumbnail2}')`,
            }}
          />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audiowaves3() {
  return (
    <div
      className="bg-[#1d1d1d] box-border content-stretch flex flex-row h-10 items-center justify-start overflow-clip px-0 py-1 relative rounded-[7px] shrink-0 w-full"
      data-name="Audiowaves"
    >
      <div
        className="h-full relative shrink-0 w-[205px]"
        data-name="Stephen 05"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 205 32"
        >
          <g id="Stephen 05">
            <path d={svgPaths.p3d037800} fill="var(--fill-0, #555555)" />
            <path d={svgPaths.p11a62900} fill="var(--fill-0, #555555)" />
          </g>
        </svg>
      </div>
      <div
        className="h-full relative shrink-0 w-[103px]"
        data-name="Kendall 05"
      >
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Kendall 04"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2f0b5c0}
              fill="var(--fill-0, #555555)"
              id="Kendall 04"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 6">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[81px]" data-name="Kendall 02">
        <div className="absolute bottom-[0.818%] left-0 right-0 top-[0.818%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 81 32"
          >
            <path
              d={svgPaths.pef34dc0}
              fill="var(--fill-0, #555555)"
              id="Kendall 02"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 01"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 7">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[103px]" data-name="Kendall 6">
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[104px]" data-name="Stephen 8">
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 9">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 10"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Track3() {
  return (
    <div
      className="absolute bg-[#2b2b2b] h-[65px] right-0 rounded-lg top-1/2 translate-y-[-50%] w-[389px]"
      data-name="Track"
    >
      <div className="box-border content-stretch flex flex-col h-[65px] items-start justify-start overflow-clip pb-px pt-0 px-px relative w-[389px]">
        <Top3 />
        <Audiowaves3 />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function TrackRail2() {
  return (
    <div
      className="bg-[#151515] h-[65px] relative rounded-lg shrink-0 w-full"
      data-name="Track rail"
    >
      <Track3 />
    </div>
  );
}

function ContentDetails() {
  return (
    <div className="relative shrink-0 w-full" data-name="Content details">
      <div className="flex flex-col items-end relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 items-end justify-start px-px py-0 relative w-full">
          <TrackRail />
          <TrackRail1 />
          <TrackRail2 />
        </div>
      </div>
    </div>
  );
}

function TracksGroup() {
  return (
    <div
      className="bg-[#1d1d1d] relative rounded-lg shrink-0 w-[902px]"
      data-name="Tracks group"
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip pb-[3px] pl-0.5 pr-[3px] pt-0 relative w-[902px]">
        <Header />
        <ContentDetails />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function Top4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top">
      <div className="flex flex-row items-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start px-2 py-1 relative w-full">
          <div
            className="[background-size:contain,_auto] bg-[#161c21] bg-[position:50%_50%,_0%_0%] h-4 rounded-sm shrink-0 w-7"
            data-name="Thumbnail"
            // style={{ backgroundImage: `url('${imgThumbnail4}')` }}
          />
          <div className="basis-0 font-['Inter:Semi_Bold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#bbbbbb] text-[11px] text-left text-nowrap">
            <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] block leading-[16px] overflow-inherit">
              Track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Audiowaves4() {
  return (
    <div
      className="bg-[#1d1d1d] box-border content-stretch flex flex-row h-10 items-center justify-start overflow-clip px-0 py-1 relative rounded-[7px] shrink-0 w-full"
      data-name="Audiowaves"
    >
      <div
        className="h-full relative shrink-0 w-[205px]"
        data-name="Stephen 05"
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 205 32"
        >
          <g id="Stephen 05">
            <path d={svgPaths.p3d037800} fill="var(--fill-0, #555555)" />
            <path d={svgPaths.p11a62900} fill="var(--fill-0, #555555)" />
          </g>
        </svg>
      </div>
      <div
        className="h-full relative shrink-0 w-[103px]"
        data-name="Kendall 05"
      >
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Kendall 04"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2f0b5c0}
              fill="var(--fill-0, #555555)"
              id="Kendall 04"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 6">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[81px]" data-name="Kendall 02">
        <div className="absolute bottom-[0.818%] left-0 right-0 top-[0.818%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 81 32"
          >
            <path
              d={svgPaths.pef34dc0}
              fill="var(--fill-0, #555555)"
              id="Kendall 02"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 01"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 7">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[103px]" data-name="Kendall 6">
        <div className="absolute bottom-[0.795%] left-0 right-0 top-[0.795%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 103 32"
          >
            <path
              d={svgPaths.p30842c00}
              fill="var(--fill-0, #555555)"
              id="Kendall 05"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[104px]" data-name="Stephen 8">
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
      <div className="h-full relative shrink-0 w-[125px]" data-name="Stephen 9">
        <div className="absolute bottom-[0.764%] left-0 right-0 top-[0.764%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 125 32"
          >
            <path
              d={svgPaths.p32ea5300}
              fill="var(--fill-0, #555555)"
              id="Stephen 6"
            />
          </svg>
        </div>
      </div>
      <div
        className="h-full relative shrink-0 w-[104px]"
        data-name="Stephen 10"
      >
        <div className="absolute bottom-[0.794%] left-0 right-0 top-[0.794%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 104 32"
          >
            <path
              d={svgPaths.p2fbd4700}
              fill="var(--fill-0, #555555)"
              id="Stephen 01"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Track4() {
  return (
    <div
      className="bg-[#2b2b2b] relative rounded-lg shrink-0 w-20"
      data-name="Track"
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip pb-px pt-0 px-px relative w-20">
        <Top4 />
        <Audiowaves4 />
      </div>
      <div className="absolute border-[1px_0px_0px] border-[rgba(250,250,250,0.15)] border-solid inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function LayerSection() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-0.5 items-start justify-start pl-10 pr-0 py-3 relative shrink-0"
      data-name="Layer section"
    >
      <div className="absolute border-[1px_0px_0px] border-[rgba(43,43,43,0)] border-solid inset-0 pointer-events-none" />
      <Track />
      <TracksGroup />
      <Track4 />
    </div>
  );
}

function ContentScenesLayersTracks() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-start justify-start pl-4 pr-0 py-0 relative shrink-0 w-[1262px]"
      data-name="Content (Scenes / Layers / Tracks)"
    >
      <Timeframes />
      <ScenesContainer />
      <LayerSection />
    </div>
  );
}

function TimelineArea() {
  return (
    <div
      className="bg-[#0e0e0e] box-border content-stretch flex flex-col items-start justify-end p-0 relative shrink-0 w-full"
      data-name="Timeline area"
    >
      <div className="absolute border-[#222222] border-[1px_0px_0px] border-solid inset-0 pointer-events-none shadow-[0px_0px_30px_0px_rgba(17,17,17,0.4)]" />
      <Controls />
      <ContentScenesLayersTracks />
    </div>
  );
}

function MainLayout() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-col grow h-full items-start justify-start min-h-px min-w-px p-0 relative shrink-0"
      data-name="Main Layout"
    >
      <TranscriptCanvas />
      <TimelineArea />
    </div>
  );
}

function SidePanelDark() {
  return (
    <div
      className="bg-[#0d0d0d] h-full relative shrink-0 w-[104px]"
      data-name="Side panel dark"
    >
      <div className="absolute border-[#222222] border-[0px_0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Body() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row gap-px grow items-center justify-start min-h-px min-w-px p-0 relative shrink-0 w-full"
      data-name="Body"
    >
      <MainLayout />
      <SidePanelDark />
    </div>
  );
}

export default function VideoEditor() {
  return (
    <div
      className="bg-[#0e0e0e] box-border content-stretch flex flex-col items-start justify-start p-0 relative size-full"
      data-name="Video Editor"
    >
      <NavigationHeader />
      <Body />
    </div>
  );
}