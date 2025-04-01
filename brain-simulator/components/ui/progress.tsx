"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { variant?: string }
>(({ className, value = 0, variant, ...props }, ref) => {
  // Calculate the display value outside the component's render cycle
  const displayValue = React.useMemo(() => {
    // Ensure value is a valid number between 0-100
    return typeof value === 'number' 
      ? Math.max(0, Math.min(100, Math.round(value))) 
      : 0;
  }, [value]);

  const variantClasses = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  }, [variant]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", variantClasses)}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
