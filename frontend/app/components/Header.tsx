// components/Header.tsx
"use client";
import Link from "next/link";
import { Sun } from "lucide-react";
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs';
import ThemeToggle from "./ThemeToggler";

export default function Header() {
  return (
    <header className="flex justify-between items-center px-6 py-4 border-b h-16">
      {/* Shifted to the right with ml-16 */}
      <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity ml-16">
        <Sun className="h-6 w-6 text-orange-500" />
        <span>RayWise</span>
      </Link>
      
      {/* Shifted to the left with mr-16 */}
      <div className="flex items-center gap-4 mr-11">
        {/* Only show Dashboard button when signed in */}
        <SignedIn>
          <Link href="/dashboard" className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Dashboard
          </Link>
        </SignedIn>
        
        <ThemeToggle />
        
        {/* Authentication buttons */}
        <SignedOut>
          <SignInButton />
          <SignUpButton>
            <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-[#5a3cd9] transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}