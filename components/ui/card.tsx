import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_40px_-24px_rgba(70,30,30,0.35)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-heading text-xl tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}
