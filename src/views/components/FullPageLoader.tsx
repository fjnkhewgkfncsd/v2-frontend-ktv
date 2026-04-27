import { Spinner } from "@/components/ui/spinner"

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-screen w-full items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Spinner className="h-6 w-6" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}
