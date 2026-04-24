import type { ComponentType, ReactNode } from "react"
import { Inbox } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface Props {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Shared empty-state block with a consistent visual treatment.
 * Replaces per-page Empty composition so pages stay focused on data.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <Empty
      className={cn(
        "rounded-xl border border-dashed border-border bg-card/40 py-16",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
