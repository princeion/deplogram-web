import type { Branch, Detection, Repository } from "@/features/deploy/deploy"

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

type MockRepo = Repository & { branches: Branch[]; detection: Detection }

// Illustrative repositories — one per runtime, plus the ones already imported as projects.
export const mockRepositories: MockRepo[] = [
  {
    id: "repo_storefront",
    fullName: "ada/storefront",
    private: false,
    defaultBranch: "main",
    updatedAt: hoursAgo(3),
    projectId: null,
    branches: [
      { name: "main", commit: { sha: "8d41f0a", message: "feat: product quick view" } },
      { name: "develop", commit: { sha: "1c9e2b7", message: "wip: cart drawer" } },
      { name: "feat/checkout", commit: { sha: "e07a5d3", message: "feat: address autocomplete" } },
    ],
    detection: { runtime: "vite", evidence: "package.json (vite)", buildCommand: "npm run build", startCommand: null, port: null, envExample: ["VITE_API_URL", "VITE_STRIPE_KEY"] },
  },
  {
    id: "repo_payments",
    fullName: "ada/payments-service",
    private: true,
    defaultBranch: "main",
    updatedAt: hoursAgo(20),
    projectId: null,
    branches: [
      { name: "main", commit: { sha: "4b7c9e1", message: "fix: idempotency on retries" } },
      { name: "release/1.2", commit: { sha: "a3f0c88", message: "chore: release 1.2.0" } },
    ],
    detection: { runtime: "go", evidence: "go.mod", buildCommand: "go build -o app ./cmd/server", startCommand: "./app", port: 8080, envExample: ["DATABASE_URL", "PAYSTACK_SECRET_KEY", "WEBHOOK_SECRET"] },
  },
  {
    id: "repo_ml",
    fullName: "ada/recommendations-api",
    private: true,
    defaultBranch: "main",
    updatedAt: hoursAgo(50),
    projectId: null,
    branches: [{ name: "main", commit: { sha: "c2d81f4", message: "feat: cold-start fallback" } }],
    detection: { runtime: "python", evidence: "requirements.txt (fastapi)", buildCommand: "pip install -r requirements.txt", startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000", port: 8000, envExample: ["MODEL_PATH", "REDIS_URL"] },
  },
  {
    id: "repo_marketing",
    fullName: "ada/marketing-site",
    private: false,
    defaultBranch: "main",
    updatedAt: hoursAgo(76),
    projectId: null,
    branches: [{ name: "main", commit: { sha: "5e6a1b9", message: "content: pricing FAQ" } }],
    detection: { runtime: "nextjs", evidence: "package.json (next)", buildCommand: "next build", startCommand: "next start", port: 3000, envExample: ["NEXT_PUBLIC_SITE_URL"] },
  },
  {
    id: "repo_crm",
    fullName: "ada/legacy-crm",
    private: true,
    defaultBranch: "master",
    updatedAt: hoursAgo(400),
    projectId: null,
    branches: [{ name: "master", commit: { sha: "9f12d0e", message: "fix: invoice rounding" } }],
    detection: { runtime: "php", evidence: "composer.json (laravel)", buildCommand: "composer install --no-dev", startCommand: "php artisan serve --host 0.0.0.0 --port 8000", port: 8000, envExample: ["APP_KEY", "DB_HOST", "DB_PASSWORD"] },
  },
  {
    id: "repo_worker",
    fullName: "ada/queue-worker",
    private: true,
    defaultBranch: "main",
    updatedAt: hoursAgo(130),
    projectId: null,
    branches: [{ name: "main", commit: { sha: "0aa4e57", message: "feat: dead-letter queue" } }],
    detection: { runtime: "docker", evidence: "Dockerfile", buildCommand: "docker build .", startCommand: null, port: 9000, envExample: ["QUEUE_URL"] },
  },
  {
    id: "repo_notes",
    fullName: "ada/scratch-notes",
    private: false,
    defaultBranch: "main",
    updatedAt: hoursAgo(900),
    projectId: null,
    branches: [{ name: "main", commit: { sha: "77b3c21", message: "notes" } }],
    // Nothing to go on — the flow asks people to pick a runtime themselves.
    detection: { runtime: null, evidence: null, buildCommand: null, startCommand: null, port: null, envExample: [] },
  },
  {
    id: "repo_orders",
    fullName: "ada/orders-api",
    private: true,
    defaultBranch: "main",
    updatedAt: hoursAgo(1),
    projectId: "prj_orders",
    branches: [{ name: "main", commit: { sha: "72c32b8", message: "feat: add order filters" } }],
    detection: { runtime: "node", evidence: "package.json (express)", buildCommand: "npm run build", startCommand: "node dist/server.js", port: 8080, envExample: ["DATABASE_URL"] },
  },
]

export const toRepository = ({ branches: _b, detection: _d, ...repository }: MockRepo): Repository => repository
