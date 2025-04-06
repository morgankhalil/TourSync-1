import { cn } from "../../lib/utils";

type SpinnerProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "default";
};

const sizeMap = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

const variantMap = {
  primary: "border-primary/30 border-t-primary",
  secondary: "border-secondary/30 border-t-secondary",
  default: "border-muted/30 border-t-muted-foreground",
};

export function Spinner({
  className,
  size = "md",
  variant = "default",
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeMap[size],
        variantMap[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex h-[100px] w-full items-center justify-center">
      <Spinner />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}