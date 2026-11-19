import type { Viewer } from "@/features/auth/session"

// Illustrative user for the mock API.
export const mockViewer: Viewer = {
  id: "usr_ada",
  name: "Ada Obi",
  email: "ada@example.com",
  image: null,
  role: "owner",
  emailVerified: true,
  createdAt: "2025-06-01T10:30:00Z",
}
