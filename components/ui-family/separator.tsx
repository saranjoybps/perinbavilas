"use client"

import * as React from "react"
import { cn } from "@/lib/family-utils"

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="separator"
      role="separator"
      className={cn("shrink-0 bg-border h-[1px] w-full", className)}
      {...props}
    />
  )
}

export { Separator }
