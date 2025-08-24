"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ⬇️ Only allow these school domains (edit as you expand)
const ALLOWED_DOMAINS = ["scu.edu"];

type Step = "request" | "verify";

export default function SignInPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simple cooldown for resend
  const [cooldown, setCooldown] = useState(0);

  // If already logged in, skip to mode-select
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace("/mode-select");
    })();
  }, [router]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function domainAllowed(address: string) {
    const d = address.split("@")[1]?.toLowerCase().trim();
    return d && d.endsWith(".edu") && ALLOWED_DOMAINS.includes(d);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!domainAllowed(email)) {
      setMsg("Campus Keys is currently limited to SCU (.scu.edu) emails.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // 🔴 forces Supabase to send a numeric code (not a magic link)
        emailOtpType: "code",
      },
    });
    setLoading(false);

    if (error) {
      setMsg(error.message || "Could not send code. Try again.");
      return;
    }

    setMsg("We emailed you a 6-digit code. Enter it below.");
    setStep("verify");
    setCooldown(30); // 30s resend cooldown
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleaned = code.replace(/\D/g, "").trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setMsg("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: cleaned,
      type: "email", // <- verify Email OTP
    });
    setLoading(false);

    if (error) {
      setMsg(error.message || "Invalid or expired code. Request a new one.");
      return;
    }

    // success
    router.replace("/mode-select");
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailOtpType: "code",
      },
    });
    if (error) setMsg(error.message || "Could not resend code.");
    else {
      setMsg("New code sent.");
      setCooldown(30);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow space-y-5">
        <h1 className="text-2xl font-semibold">Sign in to Campus Keys</h1>

        {step === "request" && (
          <form onSubmit={handleSendCode} className="space-y-3">
            <label className="text-sm text-gray-600">SCU email</label>
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
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-3">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
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
              {loading ? "Verifying…" : "Verify code"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="w-full text-sm underline disabled:opacity-50 mt-1"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setMsg(null);
              }}
              className="w-full text-sm underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {msg && <p className="text-sm">{msg}</p>}

        <p className="text-xs text-gray-500">
          By continuing you agree to the Campus Keys Terms. Codes expire quickly
          for security.
        </p>
      </div>
    </main>
  );
}
