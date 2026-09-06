import { cn } from "@/lib/utils";

export function Separator({
  className,
  ...props
}: React.ComponentProps<"hr">) {
  return (
    <hr className={cn("border-0 bg-border h-px w-full", className)} {...props} />
  );
}
