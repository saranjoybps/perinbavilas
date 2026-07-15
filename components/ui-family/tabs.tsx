"use client"

import * as React from "react"
import { cn } from "@/lib/family-utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
})

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value: controlledValue, defaultValue, onValueChange: controlledOnValueChange, children, className }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "")
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  const onValueChange = isControlled
    ? controlledOnValueChange!
    : setUncontrolledValue

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div data-slot="tabs" className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function TabsTrigger({ className, value: tabValue, ...props }: TabsTriggerProps) {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isActive = value === tabValue

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange(tabValue)}
      {...props}
    />
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function TabsContent({ className, value: tabValue, ...props }: TabsContentProps) {
  const { value } = React.useContext(TabsContext)
  const isActive = value === tabValue

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      className={cn("ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      data-state={isActive ? "active" : "inactive"}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
