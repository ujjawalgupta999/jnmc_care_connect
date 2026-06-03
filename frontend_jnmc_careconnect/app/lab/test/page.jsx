"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Calendar,
  Activity,
  Search,
  Download,
  ChevronRight,
  LogOut,
  FlaskConical,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PatientReportsPage() {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiLoading, setAiLoading] = useState(null);
  const [aiReviewData, setAiReviewData] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadReports = async () => {
      // Check authentication
      const storedAuth = localStorage.getItem("patientAuth");

      if (!storedAuth) {
        toast.error("Please login to view reports");
        router.push("/");
        return;
      }

      try {
        const parsedAuth = JSON.parse(storedAuth);
        const uhid = parsedAuth.patient?.uhid;

        if (!uhid) {
          throw new Error("Invalid patient data");
        }

        // Fetch fresh reports from API to get updated status
        const response = await fetch(`${API_URL}/lab/patient-reports/${uhid}`);
        const data = await response.json();

        if (data.success && data.reports) {
          // Update localStorage with fresh data
          const updatedAuth = {
            ...parsedAuth,
            reports: data.reports,
          };
          localStorage.setItem("patientAuth", JSON.stringify(updatedAuth));
          setPatientData(updatedAuth);
        } else {
          // Fallback to cached data if API fails
          setPatientData(parsedAuth);
        }
      } catch (e) {
        console.error("Auth/Fetch Error", e);
        // Try to use cached data on error
        try {
          const fallbackAuth = JSON.parse(localStorage.getItem("patientAuth"));
          if (fallbackAuth) {
            setPatientData(fallbackAuth);
          } else {
            localStorage.removeItem("patientAuth");
            router.push("/");
          }
        } catch {
          localStorage.removeItem("patientAuth");
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("patientAuth");
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1D3108] border-t-transparent" />
          <p className="text-lg font-medium text-gray-600">
            Loading your reports...
          </p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return null; // or redirecting state
  }

  const { patient, reports } = patientData;

  const filteredReports = reports.filter(
    (report) =>
      report.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tests.some((test) =>
        test.testName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const handleAiReview = async (bookingId) => {
    try {
      setAiLoading(bookingId);
      const response = await fetch(`${API_URL}/lab/ai-review/${bookingId}`);
      const data = await response.json();
      
      if (data.success && data.ai_review) {
        setAiReviewData(data.ai_review);
        setIsAiModalOpen(true);
      } else {
        toast.error(data.message || "Failed to analyze report");
      }
    } catch (error) {
      console.error("AI Review Error:", error);
      toast.error("Failed to generate AI review");
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="bg-gray-50/50 font-sans">
      <main className="py-8">
        {/* Patient Header Card */}
        <div className="mb-10 rounded-none bg-[#1D3108] p-8 text-white shadow-xl shadow-[#1D3108]/20 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-emerald-200">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">
                  Patient Portal
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-5xl">
                Welcome back, {patient.name.split(" ")[0]}
              </h1>
              <p className="text-lg text-emerald-100/80">
                UHID:{" "}
                <span className="font-mono font-medium text-white">
                  {patient.uhid}
                </span>
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-none bg-white/10 p-4 backdrop-blur-sm text-center min-w-[120px]">
                <p className="text-3xl font-bold">{reports.length}</p>
                <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider">
                  Total Reports
                </p>
              </div>
              <div className="rounded-none bg-white/10 p-4 backdrop-blur-sm text-center min-w-[120px]">
                <p className="text-3xl font-bold">
                  {reports.reduce((acc, r) => acc + (r.tests?.length || 0), 0)}
                </p>
                <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider">
                  Tests Taken
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Recent Reports</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by Receipt No. or Test Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-gray-200 bg-white pl-10 shadow-sm focus-visible:ring-[#1D3108] rounded-none"
            />
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-gray-300 bg-white py-20 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              No reports found
            </h3>
            <p className="mt-2 text-gray-500">
              We couldn't find any reports matching your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredReports.map((report) => (
              <Card
                key={report._id}
                className="group overflow-hidden rounded-none border border-gray-100 bg-white px-6 py-6 shadow-sm transition-all hover:border-[#1D3108]/20 hover:shadow-lg hover:shadow-[#1D3108]/5"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  {/* Left Side: Receipt & Date */}
                  <div className="space-y-4 md:w-1/3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-none bg-[#D4F1C5]/30 text-[#1D3108]">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Receipt No
                        </p>
                        <p className="font-mono text-lg font-bold text-gray-900">
                          {report.receiptNo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 pl-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Middle: Tests List */}
                  <div className="flex-1 border-l border-gray-100 pl-0 md:pl-8">
                    <p className="mb-3 text-sm font-medium text-gray-500">
                      Tests Prescribed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.tests.map((test, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 group-hover:bg-[#D4F1C5]/40 group-hover:text-[#1D3108] transition-colors rounded-none"
                        >
                          <FlaskConical className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                          {test.testName}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex flex-col gap-3 md:w-48 md:items-end">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          (report.status === "Completed"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-100") +
                          " rounded-none"
                        }
                      >
                        {report.status}
                      </Badge>
                      <Badge
                        className={
                          (report.paymentStatus === "Paid"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-red-100 text-red-700 hover:bg-red-200") +
                          " rounded-none"
                        }
                      >
                        {report.paymentStatus}
                      </Badge>
                    </div>

                    <Button
                      onClick={async () => {
                        if (report.reportUrl || report.reportPublicId) {
                          try {
                            // Fetch signed URL from backend
                            const response = await fetch(
                              `${API_URL}/lab/report-url/${report._id}`,
                            );
                            const data = await response.json();
                            if (data.success && data.reportUrl) {
                              window.open(data.reportUrl, "_blank");
                            } else {
                              toast.error("Failed to generate report URL");
                            }
                          } catch (error) {
                            console.error("Error fetching report URL:", error);
                            toast.error("Failed to load report");
                          }
                        } else {
                          toast.error("Report not generated yet");
                        }
                      }}
                      className="w-full bg-gray-900 text-white hover:bg-[#1D3108] transition-colors group-hover:shadow-md rounded-none"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button
                      onClick={() => handleAiReview(report._id)}
                      disabled={aiLoading === report._id || (!report.reportUrl && !report.reportPublicId && !report.reportKey)}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors group-hover:shadow-md rounded-none relative overflow-hidden"
                    >
                      {aiLoading === report._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      AI Review
                      <div className="absolute top-0 right-0 h-full w-12 translate-x-full bg-white/20 skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* AI Review Modal */}
      {isAiModalOpen && aiReviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">AI Report Analysis</h3>
                  <p className="text-sm text-gray-500">{aiReviewData.test}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</p>
                  <p className="font-medium text-gray-900">{aiReviewData.patient_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-medium text-gray-900">{aiReviewData.date}</p>
                </div>
              </div>

              {/* AI Interpretation */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Clinical Interpretation
                </h4>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg text-emerald-900 leading-relaxed text-sm">
                  {aiReviewData.ai_interpretation}
                </div>
              </div>

              {/* Parameters Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Key Parameters
                </h4>
                <div className="overflow-hidden border border-gray-100 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/80 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Parameter</th>
                        <th className="px-4 py-3 font-semibold">Value</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(aiReviewData.summary || {}).map(([key, data]) => (
                        <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                            {key.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {data.value} {data.unit}
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant="secondary" 
                              className={
                                data.status?.toLowerCase().includes("normal")
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : data.status?.toLowerCase().includes("high")
                                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                                  : data.status?.toLowerCase().includes("low")
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {data.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 text-xs text-gray-500 text-center rounded-b-xl">
              This summary is generated by AI (Gemini) and is for informational purposes only. Please consult your doctor for medical advice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
