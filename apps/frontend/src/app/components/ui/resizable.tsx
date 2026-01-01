"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";

import { cn } from "./utils";

// Placeholder components - these would normally come from react-resizable-panels
function ResizablePanelGroup({
  className,
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: {
  [key: string]: any;
}) {
  return <div data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: {
  withHandle?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px select-none touch-none justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:translate-x-[-50%] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize data-[panel-group-direction=horizontal]:cursor-col-resize [&[data-panel-group-direction=vertical]>div]:rotate-90",
        withHandle && "w-auto touch-auto select-auto px-1.5 py-4",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-40 flex h-4 w-4 items-center justify-center rounded-sm border border-solid border-border">
          <GripVerticalIcon className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
