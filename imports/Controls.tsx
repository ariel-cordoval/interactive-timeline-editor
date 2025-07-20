import svgPaths from "./svg-8rpjro2hbt";

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
      <Split1 />
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

function Player() {
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

function TimelineControls() {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0"
      data-name="Timeline controls"
    >
      <div className="flex flex-row items-center justify-end relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-end pl-4 pr-0 py-0.5 relative w-full">
          <Zoom />
        </div>
      </div>
    </div>
  );
}

export default function Controls() {
  return (
    <div className="relative size-full" data-name="Controls">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row items-center justify-start px-4 py-2 relative size-full">
          <Actions />
          <Player />
          <TimelineControls />
        </div>
      </div>
      <div className="absolute border-[0px_0px_1px] border-[rgba(43,43,43,0)] border-solid inset-0 pointer-events-none" />
    </div>
  );
}