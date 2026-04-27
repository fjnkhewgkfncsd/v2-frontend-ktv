import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Printer,
  Receipt,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/src/layouts/Topbar"
import { invoiceService } from "@/src/services/invoiceService"
import { ApiRequestError } from "@/src/models/api"
import type { Invoice } from "@/src/models/invoice"
import { InvoiceView } from "@/src/views/components/InvoiceView"

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const inv = await invoiceService.getById(id)
      setInvoice(inv)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Failed to load invoice."
      setError(msg)
      setInvoice(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <Topbar
        title={invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}
        subtitle={
          invoice
            ? `Session ${invoice.sessionId.slice(-6)} · ${invoice.lines.length} line${
                invoice.lines.length === 1 ? "" : "s"
              }`
            : "Viewing invoice details"
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/sessions">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => window.print()}
              disabled={!invoice}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 text-destructive"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  Could not load invoice
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load()}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading && !invoice ? (
            <Skeleton className="h-[540px] rounded-lg" />
          ) : invoice ? (
            <InvoiceView invoice={invoice} />
          ) : !error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Receipt
                className="mx-auto h-10 w-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Invoice not found.
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </>
  )
}
