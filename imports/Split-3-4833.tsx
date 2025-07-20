import svgPaths from "./svg-twv51x0gkv";

function LayoutLayersThree01() {
  return (
    <div
      className="relative shrink-0 size-4"
      data-name="Layout/layers-three-01"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
      >
        <g id="Layout/layers-three-01">
          <path
            d={svgPaths.p3aaa9400}
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

export default function Split() {
  return (
    <div className="relative rounded-lg size-full" data-name="Split">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center p-[6px] relative size-full">
          <LayoutLayersThree01 />
        </div>
      </div>
    </div>
  );
}