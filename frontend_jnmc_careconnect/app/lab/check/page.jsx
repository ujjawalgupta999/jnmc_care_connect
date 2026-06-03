"use client";

import React, { useState } from "react";
import {
  Fingerprint,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LabAadhaarCheck() {
  const router = useRouter();
  const { user } = useAuth();

  // Protect page: Redirect processor roles to pending reports
  React.useEffect(() => {
    if (
      [
        "processor",
        "sample_collector",
        "lab_collector",
        "lab_processor",
      ].includes(user?.role)
    ) {
      router.push("/lab/pending");
    }
  }, [user, router]);

  const [aadhaar, setAadhaar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error'|'new_user'|'existing', message, data }

  const formatAadhaar = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleAadhaarChange = (e) => {
    setAadhaar(formatAadhaar(e.target.value));
    setResult(null);
  };

  const handleCheck = async () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, "");

    if (cleanAadhaar.length < 12 || cleanAadhaar.length > 16) {
      setResult({
        type: "error",
        message: "Please enter a valid UHID (14 digits) or Aadhaar.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/lab/check-aadhaar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar: cleanAadhaar }),
      });

      const data = await res.json();

      if (!data.success) {
        setResult({
          type: "error",
          message: data.message || "Aadhaar not found in records.",
        });
        return;
      }

      if (data.code === "USER_EXISTS") {
        setResult({
          type: "existing",
          message: "Patient already registered in system.",
          data: data.user,
        });
      } else if (data.code === "NEW_USER") {
        setResult({
          type: "new_user",
          message: "Aadhaar verified. Patient not registered.",
          data: data.aadhaarData,
        });
      }
    } catch (err) {
      setResult({
        type: "error",
        message: "Failed to connect to server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add Patient flow is removed as patients self-register now

  const handleAddTest = () => {
    if (result && result.data) {
      const params = new URLSearchParams({
        patientId: result.data.id,
        name: result.data.name,
        uhid: result.data.uhid,
        phone: result.data.phone,
        type: result.data.type,
      });
      router.push(`/lab/booking?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-blue-200">
            <Fingerprint className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Patient Lookup
          </h1>
          <p className="text-slate-500">
            Enter UHID to check patient registration
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            UHID Number
          </label>
          <div className="relative mb-6">
            <Fingerprint
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={aadhaar}
              onChange={handleAadhaarChange}
              placeholder="0000 0000 0000 0000"
              className="w-full pl-12 pr-4 py-4 text-xl font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={isLoading || aadhaar.replace(/\s/g, "").length < 12}
            className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Checking...
              </>
            ) : (
              <>
                <Search size={20} />
                Check Patient
              </>
            )}
          </button>
        </div>

        {/* Result Cards */}
        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {result.type === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 mb-1">
                    Verification Failed
                  </h3>
                  <p className="text-red-600 text-sm">{result.message}</p>
                </div>
              </div>
            )}

            {result.type === "existing" && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 mb-1">
                      Patient Found
                    </h3>
                    <p className="text-green-600 text-sm">{result.message}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-100 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs uppercase">
                        Name
                      </span>
                      <p className="font-semibold text-slate-800">
                        {result.data.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase">
                        Phone
                      </span>
                      <p className="font-semibold text-slate-800">
                        {result.data.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase">
                        Email
                      </span>
                      <p className="font-semibold text-slate-800">
                        {result.data.email}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAddTest}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  Add Test <ArrowRight size={18} />
                </button>
              </div>
            )}

            {result.type === "new_user" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="text-amber-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800 mb-1">
                      New Patient
                    </h3>
                    <p className="text-amber-600 text-sm">{result.message}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-100 text-center text-amber-800 font-medium">
                  Please ask the patient to complete self-registration on the
                  homepage before booking a test.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
