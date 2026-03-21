"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Horizon Monitor</h1>
      <p className="text-lg">Redirecting...</p>
    </div>
  );
}