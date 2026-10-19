import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up · Deplogram" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Connect a repo and get a live URL in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:text-[#ff7a4d]">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
