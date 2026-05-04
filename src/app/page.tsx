"use client";
import { useAuth } from "../context/AuthContext";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full mx-auto mb-4"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading RoadHero...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}
