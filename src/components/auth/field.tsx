"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-[#ff5a26]/70 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#ff5a26]/15 aria-[invalid=true]:border-red-500/60";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  /** Small element shown on the right of the label, e.g. "Forgot password?" */
  labelAside?: ReactNode;
};

export function Field({ label, error, labelAside, ...props }: FieldProps) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-white/80">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={id}
        aria-invalid={!!error}
        {...props}
        className={inputClass}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, labelAside, ...props }: FieldProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-white/80">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          {...props}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/40 transition hover:text-white"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4 9.5 7a11.7 11.7 0 0 1-2.6 4M6.6 6.6A11.8 11.8 0 0 0 2.5 12c1 3 4.5 7 9.5 7 1.6 0 3-.4 4.3-1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 12C3.5 9 7 5 12 5s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-8px_rgba(255,90,38,0.45)] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5a26]/30 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      ) : (
        <>
          {children}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 11L11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}
