import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'btn-3d text-sm focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '',
        secondary: 'is-secondary',
        accent: 'is-accent',
        success: 'is-success',
        destructive: 'is-danger',
        outline: 'is-outline',
        // flat, no underside: for low-emphasis actions inside dense UI
        ghost:
          '!bg-transparent !shadow-none !text-foreground !border-transparent !normal-case !tracking-normal hover:!bg-muted active:!translate-y-0',
        link: '!bg-transparent !shadow-none !border-0 !text-primary !normal-case !tracking-normal underline-offset-4 hover:underline active:!translate-y-0',
      },
      size: {
        default: 'min-h-11 px-5 py-2',
        sm: 'min-h-9 rounded-xl px-3 text-xs [--lift:3px]',
        lg: 'min-h-14 px-8 text-base',
        icon: 'h-10 w-10 !px-0 !tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
