"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Create a client with your public env vars
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Allowlist of school email domains (MVP: SCU only)
const ALLOWED_DOMAINS = ["scu.edu"];

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic domain check
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !domain.endsWith(".edu") || !ALLOWED_DOMAINS.includes(domain)) {
      setMsg("Campus Keys is currently limited to SCU (.scu.edu) emails.");
      return;
    }

    setLoading(true);

    // Force the magic link to return to your deployed site
    const redirectTo = "https://campus-keys.vercel.app/mode-select";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    setMsg(error ? error.message : "Check your inbox for the magic link!");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign in to Campus Keys</h1>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@scu.edu"
          className="w-full border rounded-xl px-4 py-3 mb-3"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 bg-black text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>

        {msg && <p className="text-sm mt-3">{msg}</p>}
      </form>
    </main>
  );
}
