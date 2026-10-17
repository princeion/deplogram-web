"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, PasswordField, SubmitButton } from "./field";
import { GoogleButton, OrDivider } from "./google-button";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    // TODO: plug in your auth provider, e.g.
    //   NextAuth:  signIn("google", { callbackUrl: "/dashboard" })
    //   Supabase:  supabase.auth.signInWithOAuth({ provider: "google" })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      // TODO: call your auth provider with { email, password }
      void email;
      void password;
    } catch {
      setError("Invalid email or password.");
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
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          labelAside={
            <Link
              href="/forgot-password"
              className="text-xs text-white/50 transition hover:text-[#ff7a4d]"
            >
              Forgot password?
            </Link>
          }
        />

        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="pt-2">
          <SubmitButton loading={loading}>Log in</SubmitButton>
        </div>
      </form>
    </>
  );
}
