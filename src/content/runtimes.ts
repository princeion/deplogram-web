import type { IconName } from "@/content/types"

export type Runtime = {
  id: string
  name: string
  /** Frameworks/ecosystem covered, shown under the name. */
  detail: string
  icon: IconName
  /** What happens at build time (brief §4). */
  build: string
  /** What runs once it's live (brief §4). */
  run: string
  /** Illustrative defaults shown in the Configure step and runtime cards. */
  buildCommand: string
  startCommand: string
  port: string
}

// Source: Product & Technical Brief §4. The exact supported versions and container strategy are owned
// by the infrastructure team — versions are deliberately not published here.
// TODO: swap icons for official runtime marks once licensed logo assets exist.
export const runtimes: readonly Runtime[] = [
  {
    id: "vite",
    name: "Vite",
    detail: "React · Vue · Svelte",
    icon: "zap",
    build: "Install dependencies and run the configured frontend build.",
    run: "Serve the generated static output.",
    buildCommand: "npm run build",
    startCommand: "— (static output)",
    port: "—",
  },
  {
    id: "nextjs",
    name: "Next.js",
    detail: "App & Pages router",
    icon: "triangle",
    build: "Install dependencies and run the configured Next build.",
    run: "Run the resulting application.",
    buildCommand: "npm run build",
    startCommand: "npm start",
    port: "3000",
  },
  {
    id: "node",
    name: "Node.js",
    detail: "Express · Fastify · Hono",
    icon: "hexagon",
    build: "Install dependencies; a build command can be configured.",
    run: "Use the configured start command.",
    buildCommand: "npm run build",
    startCommand: "node server.js",
    port: "8080",
  },
  {
    id: "python",
    name: "Python",
    detail: "FastAPI · Flask · Django",
    icon: "braces",
    build: "Install declared dependencies and run the configured build or setup.",
    run: "Use the configured entrypoint or start process.",
    buildCommand: "pip install -r requirements.txt",
    startCommand: "uvicorn main:app",
    port: "8000",
  },
  {
    id: "php",
    name: "PHP",
    detail: "Laravel · plain PHP",
    icon: "file-code",
    build: "Install Composer dependencies where applicable.",
    run: "Run through the configured PHP server strategy.",
    buildCommand: "composer install",
    startCommand: "php artisan serve",
    port: "8000",
  },
  {
    id: "go",
    name: "Go",
    detail: "net/http · Gin · Fiber",
    icon: "gauge",
    build: "Compile the application into a binary.",
    run: "Execute the resulting binary.",
    buildCommand: "go build -o app",
    startCommand: "./app",
    port: "8080",
  },
  {
    id: "static",
    name: "Static Sites",
    detail: "HTML · CSS · JS",
    icon: "file-text",
    build: "Optional build step.",
    run: "Serve the static files.",
    buildCommand: "— (optional)",
    startCommand: "— (static files)",
    port: "—",
  },
  {
    id: "docker",
    name: "Docker",
    detail: "Bring a Dockerfile",
    icon: "container",
    build: "Build the container image from your project's configuration.",
    run: "Run the resulting container.",
    buildCommand: "docker build .",
    startCommand: "CMD from Dockerfile",
    port: "EXPOSE",
  },
]

/** The only knobs a runtime exposes (brief §4) — everything else stays underneath. */
export const runtimeConfigFields: readonly { name: string; description: string }[] = [
  { name: "Runtime version", description: "Pick from the supported versions for your runtime." },
  { name: "Build command", description: "Sensible default per runtime; override when you need to." },
  { name: "Start command", description: "How your app starts once it's built." },
  { name: "Port", description: "Where your app listens. We route the deployment URL to it." },
  { name: "Environment variables", description: "Injected securely into builds and runtimes." },
]
