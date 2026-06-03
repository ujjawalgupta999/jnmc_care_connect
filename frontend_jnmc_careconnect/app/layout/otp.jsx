"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function VerifyIdentityContent() {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const identifier = searchParams.get("uid") || "";
  const devOtp = searchParams.get("devOtp");

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!identifier) {
      toast.error("Invalid session. Please try again.");
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/reports/verify-otp`, {
        identifier,
        otp,
      });

      if (response.data.success) {
        toast.success("Verified successfully!");
        // Store session data
        localStorage.setItem(
          "patientAuth",
          JSON.stringify({
            token: "verified", // In a real app, this would be a JWT
            patient: response.data.patient,
            reports: response.data.reports,
          }),
        );

        router.push("/lab/test");
      } else {
        setIsIncorrect(true);
        setOtp("");
        toast.error(response.data.message || "Invalid OTP");
        setTimeout(() => setIsIncorrect(false), 600);
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setIsIncorrect(true);
      setOtp("");
      toast.error(error.response?.data?.message || "Verification failed");
      setTimeout(() => setIsIncorrect(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020817] p-4 font-sans text-slate-200">
      <div className="w-full max-auto max-w-[440px] rounded-none border border-slate-800 bg-[#020817] p-8 shadow-2xl md:p-12">
        {/* Icon & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <Lock className="h-8 w-8 text-blue-500" />
            <div className="absolute -right-1 bottom-1 h-2 w-2 rounded-none bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Verify Your Identity
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Enter the 6-digit OTP sent to your <br />
            registered mobile number associated with <br />
            <span className="font-medium text-slate-200">
              {identifier
                ? `${identifier.slice(0, 4)}...${identifier.slice(-4)}`
                : "your account"}
            </span>
          </p>
        </div>

        {/* OTP Input Field */}
        <div
          className={`mt-10 flex flex-col items-center justify-center ${isIncorrect ? "animate-shake" : ""}`}
        >
          <style jsx>{`
            @keyframes shake {
              0%,
              100% {
                transform: translateX(0);
              }
              20%,
              60% {
                transform: translateX(-8px);
              }
              40%,
              80% {
                transform: translateX(8px);
              }
            }
            .animate-shake {
              animation: shake 0.5s ease-in-out;
            }
          `}</style>
          <InputOTP
            maxLength={6}
            containerClassName="gap-2 sm:gap-3"
            value={otp}
            onChange={(val) => {
              setOtp(val);
              setIsIncorrect(false);
            }}
          >
            <InputOTPGroup className="gap-2">
              {[...Array(6)].map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`h-14 w-11 rounded-none border-slate-700 bg-white text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 sm:h-16 sm:w-14 ${isIncorrect ? "border-red-500 border-2" : ""}`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {/* Timer & Error Message */}
          <div className="mt-6 flex w-full flex-col items-center gap-3 px-1 text-xs sm:text-sm">
            {isIncorrect && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Incorrect OTP. Please try again.</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              Expires in:{" "}
              <span
                className={`font-mono font-medium ${timeLeft <= 60 ? "text-red-500" : "text-blue-500"}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            {devOtp && (
              <div className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded">
                [DEV] OTP is: {devOtp}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleVerify}
          disabled={loading}
          className="mt-10 w-full bg-slate-100 py-6 text-base font-medium text-slate-900 hover:bg-white hover:text-slate-950"
          variant="ghost"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <>
              Verify & Continue <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Support Link */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Having trouble?{" "}
          <a
            href="#"
            className="text-blue-500 underline-offset-4 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyIdentity() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <VerifyIdentityContent />
    </Suspense>
  );
}
