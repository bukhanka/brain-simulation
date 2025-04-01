import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  time?: string
  icon?: React.ReactNode
  isLast?: boolean
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-3", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, title, description, time, icon, isLast = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex gap-3", className)}
        {...props}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background">
            {icon || (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          {!isLast && (
            <div className="h-full w-px bg-border mt-1" />
          )}
        </div>
        <div className="flex flex-col pb-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-medium">{title}</h3>
            {time && (
              <span className="text-xs text-muted-foreground">· {time}</span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    )
  }
)
TimelineItem.displayName = "TimelineItem"

export { Timeline, TimelineItem } 