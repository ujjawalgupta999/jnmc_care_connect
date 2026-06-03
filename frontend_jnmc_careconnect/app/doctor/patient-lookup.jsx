"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Fingerprint, Stethoscope } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function PatientLookup() {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const cleanValue = searchValue.replace(/\s/g, "");
    if (cleanValue) {
      // Redirect to history page with generic 'id' query param
      router.push(`/doctor/history?id=${encodeURIComponent(cleanValue)}`);
    }
  };

  const handleInputChange = (e) => {
    let value = e.target.value;
    // Remove spaces to get raw value
    const rawValue = value.replace(/\s/g, "");

    // If it's a numeric input (like Aadhaar), format with spaces every 4 digits
    if (/^\d+$/.test(rawValue)) {
      const formatted = rawValue.match(/.{1,4}/g)?.join(" ") || rawValue;
      setSearchValue(formatted);
    } else {
      // If it has other chars (like hyphen for UHID), keep as is
      setSearchValue(rawValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200">
            <Fingerprint className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Patient Lookup
          </h1>
          <p className="text-gray-500">
            Enter UHID or Aadhaar number to check patient history
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                UHID / Aadhaar
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 23-10934 or 1234 5678 9012"
                  className="h-14 bg-gray-50 border-gray-200 rounded-xl px-4 text-lg font-medium tracking-wide focus:bg-white transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              <Stethoscope className="mr-2 h-5 w-5" />
              Consult Patient
            </Button>
          </div>
        </div>

        <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Secure • Reliable • Fast
        </div>
      </div>
    </div>
  );
}
