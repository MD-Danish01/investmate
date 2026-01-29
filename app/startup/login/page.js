"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartupLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error);
      }

      if (result.user.role !== "startup") {
        throw new Error("Please use investor login");
      }

      router.push("/startup/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#293241]">Startup Login</h1>

        {error && (
          <div className="bg-red-50 text-[#9e2a2b] p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9e2a2b] text-white p-3 rounded hover:bg-[#7d2122] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/startup/register" className="text-[#335c67] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
