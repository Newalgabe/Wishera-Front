"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username");

    if (token) {
      localStorage.setItem("token", token);
    }
    if (userId) {
      localStorage.setItem("userId", userId);
    }
    if (username) {
      localStorage.setItem("username", username);
    }

    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Completing sign-in…</p>
    </div>
  );
}


