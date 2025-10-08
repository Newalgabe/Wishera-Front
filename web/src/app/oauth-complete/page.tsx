"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OAuthCompletePage() {
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    // This page is optional; backend currently returns JSON on callback.
    // If backend switches to redirect here with a token, parse and store it.
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      setMessage("Signed in successfully. Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      setMessage("You can close this window and return to the app.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded-lg border">
        <p>{message}</p>
        <div className="mt-4">
          <Link href="/login" className="text-blue-600 underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}


