"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useSignIn } from "@/features/auth/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

// TODO (authentication task): design this page; add GitHub sign-in once the backend exposes it.
export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const signIn = useSignIn()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    signIn.mutate(
      { email, password },
      {
        onSuccess: () => router.push(searchParams.get("callbackUrl") ?? "/dashboard"),
        onError: () => setError("Invalid email or password"),
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label htmlFor="email" className="sr-only">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Label htmlFor="password" className="sr-only">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={signIn.isPending}>
            Sign in
          </Button>
        </form>
        {error && (
          <Alert variant="destructive">{error}</Alert>
        )}
      </div>
    </div>
  )
}