import { useState } from "react";
import { Eye, Download, Loader2, UserPlus, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PatientAccessPortal() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // null, 'download', or 'register'
  const router = useRouter();

  const handleIdentifierChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setIdentifier(formatted);
  };

  const handleSearch = async () => {
    const rawIdentifier = identifier.replace(/\s/g, "");

    if (!rawIdentifier) {
      toast.error("Please enter your UHID");
      return;
    }

    if (rawIdentifier.length < 12) {
      toast.error("Please enter a valid UHID");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/reports/request-otp`, {
        identifier: rawIdentifier,
      });

      if (response.data.success) {
        toast.success("OTP sent to your registered mobile number");
        router.push(`/verify?uid=${rawIdentifier}${response.data.devOtp ? `&devOtp=${response.data.devOtp}` : ""}`);
      } else {
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("OTP Request Error:", error);
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="w-full rounded-[32px] border border-gray-200 bg-white p-10 shadow-sm text-left">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold tracking-tight text-[#1D3108]">
            Patient Portal
          </h2>
          <div className="mt-2 h-[1px] w-full max-w-md bg-[#1D3108]/30" />
          <p className="mt-4 text-lg font-medium text-[#2E4185]">
            Register as a new patient or download your lab reports using your UHID.
          </p>
        </div>

        {/* Action Options */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            onClick={() => router.push("/register")}
            className="flex-1 h-16 text-lg bg-[#D4F1C5] text-black hover:bg-[#c4e1b5] border border-transparent rounded-2xl"
          >
            <UserPlus className="mr-3 h-6 w-6" />
            Register as New Patient
          </Button>
          <Button
            onClick={() => setActiveTab("download")}
            className={`flex-1 h-16 text-lg rounded-2xl ${
              activeTab === "download"
                ? "bg-[#1D3108] text-white hover:bg-[#1D3108]/90"
                : "bg-gray-100 text-black hover:bg-gray-200 border-transparent"
            }`}
            variant={activeTab === "download" ? "default" : "outline"}
          >
            <FileText className="mr-3 h-6 w-6" />
            Download Reports
          </Button>
        </div>

        {/* Download Form */}
        {activeTab === "download" && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Label className="text-xl font-semibold text-black">
              UHID / Unique Number
            </Label>
            
            <div className="flex flex-col md:flex-row gap-6 w-full">
              {/* UHID Input */}
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  className="h-14 border-gray-300 px-4 text-lg placeholder:text-gray-400 focus-visible:ring-[#1D3108] rounded-xl"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  <Eye className="h-6 w-6" />
                </button>
              </div>

              {/* Download Button */}
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-14 w-full bg-[#050A14] px-8 text-base font-medium text-white hover:bg-[#050A14]/90 md:w-auto rounded-xl flex-shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Get OTP
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
