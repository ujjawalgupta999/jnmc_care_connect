"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function QRReportAccess() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestOTP = async () => {
      try {
        const response = await axios.post(`${API_URL}/reports/request-otp`, {
          identifier: id,
        });

        if (response.data.success) {
          toast.success(
            "Verification code sent to your registered mobile number",
          );
          router.push(`/verify?uid=${id}`);
        } else {
          setError(response.data.message || "Failed to start verification");
        }
      } catch (err) {
        console.error("QR OTP Error:", err);
        setError(
          err.response?.data?.message ||
            "Something went wrong. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      requestOTP();
    }
  }, [id, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-8 shadow-lg text-center rounded-2xl border border-red-100">
          <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Error
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl rounded-[32px] border border-gray-100">
        <div className="relative mb-10 inline-block">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="absolute -right-1 bottom-1 h-4 w-4 rounded-full bg-green-500 border-4 border-white shadow-sm" />
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
          Securing Access
        </h2>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          Requesting a secure verification code to your registered mobile
          number...
        </p>

        <div className="flex items-center justify-center gap-3 text-blue-600 font-bold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Please wait...</span>
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-sm font-medium">
        JNMC PathConnect • Secure Patient Portal
      </p>
    </div>
  );
}
