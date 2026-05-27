import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/30 focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
