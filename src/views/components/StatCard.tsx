import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  label: string
  value: number | string
  helper?: string
  accentClass?: string
  dotClass?: string
  icon?: React.ReactNode
  isLoading?: boolean
}

export function StatCard({
  label,
  value,
  helper,
  accentClass,
  dotClass,
  icon,
  isLoading,
}: Props) {
  return (
    <Card className="relative overflow-hidden border-border/70">
      <div
        aria-hidden="true"
        className={cn("absolute inset-x-0 top-0 h-0.5", accentClass)}
      />
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dotClass ? (
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full", dotClass)}
              />
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          </div>
          {icon ? (
            <div className="text-muted-foreground/70">{icon}</div>
          ) : null}
        </div>

        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}

        {helper ? (
          <p className="text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
