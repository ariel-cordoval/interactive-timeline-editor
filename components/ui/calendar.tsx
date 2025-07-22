"use client";

import * as React from "react";
import { cn } from "./utils";

// Stub implementation - calendar functionality disabled until react-day-picker is installed
export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | { from: Date; to?: Date };
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
};

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn("p-3", className)}
      {...props}
    >
      <div className="text-sm text-muted-foreground">
        Calendar component requires react-day-picker to be installed.
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
