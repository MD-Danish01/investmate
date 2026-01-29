"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartupRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: "startup",
      startupName: formData.get("startupName"),
      tagline: formData.get("tagline"),
      problem: formData.get("problem"),
      solution: formData.get("solution"),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error);
      }

      router.push("/startup/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#293241]">Register as Startup</h1>

        {error && (
          <div className="bg-red-50 text-[#9e2a2b] p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Founder Name"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
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
            minLength={6}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
          <input
            name="startupName"
            type="text"
            placeholder="Startup Name"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
          <input
            name="tagline"
            type="text"
            placeholder="Tagline"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
          <textarea
            name="problem"
            placeholder="Problem you're solving"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />
          <textarea
            name="solution"
            placeholder="Your solution"
            required
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#335c67]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9e2a2b] text-white p-3 rounded hover:bg-[#7d2122] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <Link href="/startup/login" className="text-[#335c67] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
