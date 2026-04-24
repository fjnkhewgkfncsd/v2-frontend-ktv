import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { AlertCircle, Lock, Music2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/src/contexts/AuthContext"

interface FieldErrors {
  username?: string
  password?: string
}

export default function LoginPage() {
  const { login, isLoggingIn, loginError, isAuthenticated, isBootstrapping } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  if (isBootstrapping) return null
  if (isAuthenticated) {
    const from =
      (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
      "/dashboard"
    return <Navigate to={from} replace />
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (username.trim().length < 3)
      errors.username = "Username must be at least 3 characters."
    if (password.length < 6)
      errors.password = "Password must be at least 6 characters."
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    const ok = await login(username.trim(), password)
    if (ok) {
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard"
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambient background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,var(--background))]" />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Music2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              KTV Operations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage rooms, reservations, and sessions.
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-xl shadow-primary/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Welcome back</CardTitle>
            <CardDescription>
              Use your operator credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              {loginError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="reception"
                    disabled={isLoggingIn}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={
                      fieldErrors.username ? "username-error" : undefined
                    }
                    className="pl-9"
                    required
                  />
                </div>
                {fieldErrors.username ? (
                  <p
                    id="username-error"
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {fieldErrors.username}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoggingIn}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
                    className="pl-9"
                    required
                  />
                </div>
                {fieldErrors.password ? (
                  <p
                    id="password-error"
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="mt-2 w-full gap-2"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          KTV Management System &middot; Operator Console
        </p>
      </div>
    </div>
  )
}
