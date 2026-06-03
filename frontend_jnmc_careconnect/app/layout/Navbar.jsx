"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Key,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getDashboardLink = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "sub_admin":
        return "/sub-admin/dashboard";
      case "doctor":
        return "/doctor";
      case "lab":
        return "/lab/check";
      case "user":
        return "/user/profile";
      default:
        return "/";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "sub_admin":
        return "Sub Admin";
      case "doctor":
        return "Doctor";
      case "lab":
        return "Lab Staff";
      case "user":
        return "Patient";
      default:
        return "Member";
    }
  };

  return (
    <nav className="bg-[#051C12] text-white px-6 py-4 sticky top-0 z-50 border-b border-white/5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between w-full">
        {/* Logo Section */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-all duration-300"
        >
          <div className="w-10 h-10 bg-white flex items-center justify-center overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/amulogo.png"
              alt="JNMC Logo"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight tracking-wider text-white">
              JNMC
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B5E4A3] font-semibold leading-tight opacity-80">
              CareConnect
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10 text-xs uppercase tracking-widest font-semibold">
          <Link
            href="/"
            className="hover:text-[#B5E4A3] transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            href="/doctor"
            className="hover:text-[#B5E4A3] transition-colors duration-300"
          >
            Services
          </Link>
          <Link
            href="/emergency"
            className="text-red-400 hover:text-red-500 transition-colors duration-300 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3 h-3" />
            Emergency
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-2 py-1.5 rounded-none hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
              >
                <div className="w-8 h-8 rounded-none bg-[#B5E4A3] flex items-center justify-center text-[#051C12] font-bold shadow-md shadow-[#B5E4A3]/20">
                  {user.name?.[0]?.toUpperCase() || (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start text-left leading-none">
                  <span className="text-xs font-bold">{user.name}</span>
                  <span className="text-[10px] text-[#B5E4A3] opacity-70 mt-0.5">
                    {getRoleLabel(user.type)}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-[#0A261B] border border-white/10 shadow-2xl rounded-none overflow-hidden py-2 z-20 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href={getDashboardLink(user.type)}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors duration-200"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#B5E4A3]" />
                      <span>Dashboard</span>
                    </Link>
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              asChild
              variant="outline"
              className="bg-[#B5E4A3] text-[#051C12] border-none hover:bg-[#A4D392] transition-all duration-300 rounded-none px-6 shadow-lg shadow-[#B5E4A3]/10"
            >
              <Link href="/staff-login" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Staff Login
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
