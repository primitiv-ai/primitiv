import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] font-display font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        filled: "bg-primary text-primary-foreground hover:bg-primary/90",
        tonal: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outlined:
          "border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        text: "text-primary rounded-[16px] hover:bg-accent/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
      },
      size: {
        md: "px-6 py-4 text-base/6 tracking-[0.15px]",
        sm: "px-4 py-2.5 text-sm/5 tracking-[0.1px]",
        xs: "px-3 py-1.5 text-sm/5 tracking-[0.1px] gap-1 rounded-[3px]",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-xs": "size-6 rounded-[3px] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "filled",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
