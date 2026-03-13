import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs border border-foreground bg-card px-3 py-1.5",
              "text-xs font-bold uppercase tracking-widest text-foreground",
              "animate-in fade-in-0 zoom-in-95",
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
