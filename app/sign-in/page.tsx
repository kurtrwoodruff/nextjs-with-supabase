"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// MVP: only allow SCU for now
const ALLOWED_DOMAINS = ["scu.edu"];

export default function SignInOTP() {
  const router = useRouter();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If you're already signed in, skip this page
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace("/mode-select");
    })();
  }, [router]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // basic domain guard
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !domain.endsWith(".edu") || !ALLOWED_DOMAINS.includes(domain)) {
      setMsg("Campus Keys is currently limited to SCU (.scu.edu) emails.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // create user if first time
      },
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("We emailed you a 6-digit code. Enter it below.");
      setStep("verify");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setMsg("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email", // verifies Email OTP
    });
    setLoading(false);

    if (error) {
      setMsg(error.message || "Invalid or expired code. Request a new one.");
    } else {
      router.replace("/mode-select");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to Campus Keys</h1>

        {step === "request" && (
          <form onSubmit={requestCode} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@scu.edu"
              className="w-full border rounded-xl px-4 py-3"
            />
            <button
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 bg-black text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <label className="text-sm text-gray-600 block">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </label>
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full border rounded-xl px-4 py-3 tracking-widest text-center"
            />
            <button
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 bg-black text-white disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-sm underline mt-2"
            >
              Use a different email
            </button>
          </form>
        )}

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>
    </main>
  );
}
