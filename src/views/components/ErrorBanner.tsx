import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  title?: string
  message: string
  onRetry?(): void
  className?: string
}

/**
 * Consistent inline error banner used across list/detail pages.
 * Thin view component — keeps retry/message orchestration in the caller.
 */
export function ErrorBanner({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm",
        className,
      )}
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-destructive">{title}</p>
        <p className="text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
