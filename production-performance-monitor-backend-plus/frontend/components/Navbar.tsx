"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-primary dark:bg-primary-dark p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          Horizon Monitor
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-white hover:text-primary-light transition-colors">
                Dashboard
              </Link>
              <span className="text-white text-sm">Welcome, {user.email}</span>
              <button onClick={handleLogout} className="btn-secondary bg-white text-primary hover:bg-gray-100">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-primary-light transition-colors">
                Login
              </Link>
              <Link href="/register" className="btn-secondary bg-white text-primary hover:bg-gray-100">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu content */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2">
          {user ? (
            <>
              <Link href="/dashboard" className="block text-white hover:text-primary-light transition-colors py-2">
                Dashboard
              </Link>
              <span className="block text-white text-sm py-2">Welcome, {user.email}</span>
              <button onClick={handleLogout} className="btn-secondary bg-white text-primary hover:bg-gray-100 w-full">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-white hover:text-primary-light transition-colors py-2">
                Login
              </Link>
              <Link href="/register" className="btn-secondary bg-white text-primary hover:bg-gray-100 w-full">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}