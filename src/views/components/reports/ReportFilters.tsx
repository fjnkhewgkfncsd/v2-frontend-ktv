import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface DailyProps {
  date: string
  onChange(date: string): void
  onApply(): void
  isLoading: boolean
}

export function DailyReportFilters({
  date,
  onChange,
  onApply,
  isLoading,
}: DailyProps) {
  const today = isoDateToday()
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:w-64">
          <Label htmlFor="report-date">Date</Label>
          <Input
            id="report-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <Button
          onClick={onApply}
          disabled={isLoading || !date}
          size="sm"
          className="self-start sm:self-end"
        >
          {isLoading ? "Loading..." : "View report"}
        </Button>
      </CardContent>
    </Card>
  )
}

interface MonthlyProps {
  year: number
  month: number
  onChange(year: number, month: number): void
  onApply(): void
  isLoading: boolean
}

export function MonthlyReportFilters({
  year,
  month,
  onChange,
  onApply,
  isLoading,
}: MonthlyProps) {
  const now = new Date()
  const years = buildYearOptions(now.getFullYear())
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:w-96">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-month">Month</Label>
            <Select
              value={String(month)}
              onValueChange={(v) => onChange(year, Number(v))}
            >
              <SelectTrigger id="report-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((label, idx) => (
                  <SelectItem key={label} value={String(idx + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-year">Year</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => onChange(Number(v), month)}
            >
              <SelectTrigger id="report-year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={onApply}
          disabled={isLoading}
          size="sm"
          className="self-start sm:self-end"
        >
          {isLoading ? "Loading..." : "View report"}
        </Button>
      </CardContent>
    </Card>
  )
}

interface RangeProps {
  startDate: string
  endDate: string
  onStartChange(date: string): void
  onEndChange(date: string): void
  onApply(): void
  isLoading: boolean
}

export function RangeReportFilters({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onApply,
  isLoading,
}: RangeProps) {
  const today = isoDateToday()
  const invalid =
    !!startDate && !!endDate && new Date(endDate) < new Date(startDate)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="range-start">Start date</Label>
            <Input
              id="range-start"
              type="date"
              value={startDate}
              max={endDate || today}
              onChange={(e) => onStartChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="range-end">End date</Label>
            <Input
              id="range-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today}
              onChange={(e) => onEndChange(e.target.value)}
              aria-invalid={invalid}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={onApply}
              disabled={isLoading || invalid || !startDate || !endDate}
              size="sm"
              className="w-full"
            >
              {isLoading ? "Loading..." : "View report"}
            </Button>
          </div>
        </div>
        {invalid ? (
          <p className="text-xs text-destructive">
            End date must be on or after the start date.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <QuickRangeButton
            label="Last 7 days"
            days={6}
            onApply={(s, e) => {
              onStartChange(s)
              onEndChange(e)
            }}
          />
          <QuickRangeButton
            label="Last 30 days"
            days={29}
            onApply={(s, e) => {
              onStartChange(s)
              onEndChange(e)
            }}
          />
          <QuickRangeButton
            label="This month"
            thisMonth
            onApply={(s, e) => {
              onStartChange(s)
              onEndChange(e)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickRangeButton({
  label,
  days,
  thisMonth,
  onApply,
}: {
  label: string
  days?: number
  thisMonth?: boolean
  onApply(start: string, end: string): void
}) {
  const handle = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (thisMonth) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      onApply(isoDate(start), isoDate(today))
      return
    }
    const start = new Date(today)
    start.setDate(start.getDate() - (days ?? 0))
    onApply(isoDate(start), isoDate(today))
  }
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={handle}
      className="h-7 px-2 text-xs"
    >
      {label}
    </Button>
  )
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isoDateToday(): string {
  return isoDate(new Date())
}

function buildYearOptions(currentYear: number): number[] {
  const years: number[] = []
  for (let y = currentYear; y >= currentYear - 4; y--) years.push(y)
  return years
}
