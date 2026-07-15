"use client";

import * as React from "react"

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function Slot({ children, ...props }: SlotProps) {
  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>
    const merged = {
      ...props,
      ...childProps,
      style: { ...(typeof childProps.style === "object" ? childProps.style : {}), ...(typeof props.style === "object" ? props.style : {}) },
      className: [childProps.className, props.className].filter(Boolean).join(" "),
    } as Record<string, unknown>
    return React.cloneElement(children, merged as React.HTMLAttributes<HTMLElement>)
  }
  return <>{children}</>
}

export { Slot }
