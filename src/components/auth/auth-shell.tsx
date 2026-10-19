import Link from "next/link";
import type { ReactNode } from "react";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="3.5" stroke="white" strokeWidth="1.6" />
        <circle cx="14.5" cy="4.5" r="2.2" stroke="white" strokeWidth="1.4" />
        <circle cx="10.5" cy="14" r="2.6" stroke="white" strokeWidth="1.4" />
        <circle cx="20" cy="12" r="3.6" fill="#ff5a26" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-white">
        deplogram
      </span>
    </Link>
  );
}

const STEPS = [
  { label: "Cloned galley/orders-api", meta: "0.8s", done: true },
  { label: "Detected runtime · Node 22", meta: "0.1s", done: true },
  { label: "Installed dependencies", meta: "6.2s", done: true },
  { label: "Building production bundle", meta: "running", done: false },
];

function Showcase() {
  return (
    <div className="relative hidden overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_15%_0%,#ffb04a_0%,#ff6a2b_32%,#f2491b_66%,#c93a10_100%)] lg:flex lg:flex-col">
      {/* soft light + grain-like depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_80%_100%,rgba(0,0,0,0.35),transparent)]" />

      <div className="relative z-10 px-12 pt-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Early access
        </span>
        <h2 className="mt-6 max-w-md text-4xl font-semibold leading-[1.08] tracking-tight text-white xl:text-5xl">
          From GitHub repo to live URL in minutes.
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
          Eight runtimes, one workspace, code editor, storage and APIs — all on
          one lightweight developer cloud.
        </p>
      </div>

      {/* deployment window, bleeds off the bottom-right like the landing hero */}
      <div className="relative z-10 mt-auto pl-12 pt-12">
        <div className="rounded-tl-2xl border border-b-0 border-r-0 border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <span className="font-mono text-[11px] text-white/60">
                galley / orders-api / deployments / #42
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff5a26]/50 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-[#ff7a4d]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5a26]" />
              BUILDING
            </span>
          </div>

          <div className="space-y-1 px-5 py-5">
            <p className="mb-3 text-sm font-medium text-white">
              feat: add order filters
            </p>
            {STEPS.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] odd:bg-white/[0.03]"
              >
                <span className="flex items-center gap-3 text-white/80">
                  {s.done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7.5l2.5 2.5L11 4.5"
                        stroke="#ff7a4d"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-[#ff5a26]" />
                  )}
                  {s.label}
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  {s.meta}
                </span>
              </div>
            ))}
            <div className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-black text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-4 lg:p-4">
      <section className="relative flex min-h-screen flex-col overflow-hidden px-6 py-8 sm:px-10 lg:min-h-0 lg:px-14">
        {/* ambient orange glow, same warmth as the landing page header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,90,38,0.16),transparent)]" />

        <header className="relative flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Back to home
          </Link>
        </header>

        <div className="relative mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-white/55">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-sm text-white/50">{footer}</p>
        </div>

        <p className="relative text-center text-xs text-white/30">
          © 2026 Deplogram. All rights reserved.
        </p>
      </section>

      <Showcase />
    </main>
  );
}
