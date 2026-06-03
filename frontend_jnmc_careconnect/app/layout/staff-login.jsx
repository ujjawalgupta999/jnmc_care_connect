"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  Clock,
  User,
  EyeOff,
  Eye,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginUser,
  doctorLogin,
  employeeLogin,
  subAdminLogin,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { login: loginToContext } = auth;
      let data = null;
      let userType = "";

      // Attempt Sequential Login Strategy
      try {
        // 1. Try Admin Login
        data = await loginUser(email, password);
        userType = "admin";
      } catch (adminErr) {
        try {
          // 2. Try Sub Admin Login
          data = await subAdminLogin(email, password);
          userType = "sub_admin";
        } catch (subAdminErr) {
          try {
            // 3. Try Doctor Login
            data = await doctorLogin(email, password);
            userType = "doctor";
          } catch (doctorErr) {
            try {
              // 4. Try Employee Login
              data = await employeeLogin(email, password);
              userType = "lab";
            } catch (employeeErr) {
              // All attempts failed
              throw new Error("Invalid credentials or user not found");
            }
          }
        }
      }

      if (data && data.token) {
        let userData;
        if (data.user) userData = { ...data.user, type: "admin" };
        else if (data.subAdmin)
          userData = { ...data.subAdmin, type: "sub_admin" };
        else if (data.doctor) userData = { ...data.doctor, type: "doctor" };
        else if (data.employee) userData = { ...data.employee, type: "lab" };

        if (userData) {
          loginToContext(userData, data.token);

          // Redirect based on user type and role
          if (userData.type === "admin") {
            router.push("/admin");
          } else if (userData.type === "sub_admin") {
            router.push("/sub-admin/dashboard");
          } else if (userData.type === "doctor") {
            router.push("/doctor");
          } else if (userData.type === "lab") {
            if (userData.role === "processor" || userData.role === "sample_collector" || userData.role === "lab_collector" || userData.role === "lab_processor") {
              router.push("/lab/pending");
            } else {
              router.push("/lab/check");
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white">
      {/* Left Side: Branding & Image */}
      <div className="relative hidden w-full md:flex md:w-1/2 lg:w-[55%] items-end p-16">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/jnmc.png"
            alt="JNMC Healthcare"
            className="h-full w-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-xl text-white animate-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 flex h-16 w-16 items-center justify-center border-2 border-white/20 bg-white/10 backdrop-blur-xl">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tighter lg:text-6xl uppercase">
            Precision
            <br />
            Healthcare
            <br />
            Portal
          </h1>
          <p className="mb-10 text-lg text-gray-300 font-medium leading-relaxed max-w-md">
            The unified gateway for JNMC medical professionals. Access
            diagnostics, patient records, and lab analytics with
            enterprise-grade security.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 border border-white/20 bg-white/5 px-5 py-2.5 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Secure Core
              </span>
            </div>
            <div className="flex items-center gap-2 border border-white/20 bg-white/5 px-5 py-2.5 backdrop-blur-md">
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-col p-8 md:w-1/2 lg:w-[45%] justify-between bg-white border-l border-gray-50 uppercase">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/amulogo.png"
              alt="AMU Logo"
              className="h-12 w-12 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter leading-none italic">
                JNMC CARE
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400">
                CONNECT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              <HelpCircle className="h-4 w-4" />
              Support
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col py-12">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
              Staff
              <br />
              Portal
            </h2>
            <div className="mt-4 h-1 w-12 bg-black"></div>
          </div>

          <form className="space-y-8" onSubmit={handleLogin}>
            <div className="space-y-6">
              {/* ID / Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="id"
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Staff ID / Email Address
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-4 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                  <Input
                    id="id"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your credentials"
                    className="h-14 pl-12 border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-black text-base font-bold transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-14 pl-12 pr-12 border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-black text-base font-bold transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-300 hover:text-black transition-colors"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-none bg-red-50 p-4 border-l-4 border-red-500 text-[11px] font-bold text-red-600 uppercase tracking-tight">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 rounded-none text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Authenticate Account"
              )}
            </Button>
          </form>

          <p className="mt-10 flex items-center gap-3 border border-gray-100 p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
            Restricted System: Authorized Personnel Only.
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
          <span>© 2026 JNMC HQ</span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
}
