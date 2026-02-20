import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-wide uppercase transition-all duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(30,10,60,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(30,10,60,1)]",
        destructive:
          "bg-destructive text-white border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(30,10,60,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(30,10,60,1)]",
        outline:
          "bg-transparent text-foreground border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(30,10,60,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(30,10,60,1)]",
        secondary:
          "bg-secondary text-secondary-foreground border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(30,10,60,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(30,10,60,1)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
