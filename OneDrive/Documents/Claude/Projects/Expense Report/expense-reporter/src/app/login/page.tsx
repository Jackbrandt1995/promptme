"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const quickLogin = async (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: quickEmail,
      password: quickPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("Login failed. Have you run the database seed?");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <span className="text-2xl text-white font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ExpenseBot</h1>
          <p className="text-slate-500 mt-1">
            Smart expense reporting made simple
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          {/* Quick login for dev */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-3">
              Demo accounts (development only)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickLogin("jane@acmecorp.com", "employee123")}
                disabled={loading}
              >
                Employee login
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickLogin("admin@acmecorp.com", "admin123")}
                disabled={loading}
              >
                Admin login
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Secure login powered by NextAuth.js
        </p>
      </div>
    </div>
  );
}
