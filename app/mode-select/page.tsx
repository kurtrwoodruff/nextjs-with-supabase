"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ModeSelectPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function setMode(mode: "SEEKER" | "LISTER") {
    setLoading(true);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in.");
      router.push("/sign-in");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        mode,
        school_id: null // later we’ll auto-link to SCU via domain
      });

    setLoading(false);
    if (error) {
      alert("Error saving mode: " + error.message);
    } else {
      router.push("/dashboard"); // we’ll build this page next
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8">What are you here for?</h1>
      <div className="flex gap-6">
        <button
          disabled={loading}
          onClick={() => setMode("SEEKER")}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700"
        >
          I’m seeking housing
        </button>
        <button
          disabled={loading}
          onClick={() => setMode("LISTER")}
          className="px-6 py-4 bg-green-600 text-white rounded-2xl shadow-lg hover:bg-green-700"
        >
          I’m offering housing
        </button>
      </div>
    </main>
  );
}
