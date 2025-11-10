"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OAuthCompletePage() {
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    // Parse authentication data from URL query parameters
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username");
    
    if (token) {
      // Store authentication data
      localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", userId);
      if (username) localStorage.setItem("username", username);
      
      setMessage("Signed in successfully. Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      setMessage("Authentication failed. Please try again.");
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


