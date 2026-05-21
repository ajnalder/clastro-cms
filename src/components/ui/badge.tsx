import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        accent: 'border-transparent bg-accent text-accent-foreground',
        default: 'border-transparent bg-primary text-primary-foreground',
        destructive: 'border-transparent bg-destructive text-white',
        muted: 'border-transparent bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
      },
    },
  },
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
