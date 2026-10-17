"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, PasswordField, SubmitButton } from "./field";
import { GoogleButton, OrDivider } from "./google-button";

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function SignupForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const score = strength(password);

  async function handleGoogle() {
    // TODO: plug in your auth provider, e.g.
    //   NextAuth:  signIn("google", { callbackUrl: "/dashboard" })
    //   Supabase:  supabase.auth.signInWithOAuth({ provider: "google" })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    try {
      // TODO: call your auth provider with { name, email, password }
      void name;
      void email;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GoogleButton onClick={handleGoogle} />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
        />
        <Field
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password && (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= score ? "bg-[#ff5a26]" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-xs text-white/50">
                {LABELS[score]}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="pt-2">
          <SubmitButton loading={loading}>Create account</SubmitButton>
        </div>

        <p className="text-center text-xs leading-relaxed text-white/40">
          By continuing you agree to our{" "}
          <Link href="/terms" className="text-white/70 underline-offset-2 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-white/70 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </>
  );
}
