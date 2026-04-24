import { Construction } from "lucide-react"
import { Topbar } from "@/src/layouts/Topbar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface Props {
  title: string
  subtitle?: string
  description?: string
}

export default function PlaceholderPage({
  title,
  subtitle,
  description,
}: Props) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <Empty className="rounded-xl border border-dashed border-border bg-card/40 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Construction className="h-5 w-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{title} coming soon</EmptyTitle>
              <EmptyDescription>
                {description ??
                  "This module is planned for a future iteration. Core foundations are already in place."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        </div>
      </main>
    </>
  )
}
