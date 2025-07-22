"use client";

import * as React from "react";
import { cn } from "./utils";

// Stub implementation - carousel functionality disabled until embla-carousel-react is installed
type CarouselProps = React.HTMLAttributes<HTMLDivElement>;

const CarouselContext = React.createContext<{}>({});

function useCarousel() {
  const context = React.useContext(CarouselContext);
  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <CarouselContext.Provider value={{}}>
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        <div className="text-sm text-muted-foreground p-4">
          Carousel component requires embla-carousel-react to be installed.
        </div>
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn("absolute left-4 top-1/2 -translate-y-1/2", className)}
      {...props}
    >
      ←
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn("absolute right-4 top-1/2 -translate-y-1/2", className)}
      {...props}
    >
      →
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  type CarouselProps,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};
