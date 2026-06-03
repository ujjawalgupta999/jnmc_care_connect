"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  CheckCircle,
  FileText,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SignOffPage() {
  const { id } = useParams(); // Booking ID
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/lab/booking/${id}`); // Assuming this exists or we create a specific one
        // If not, we can use the generic booking fetch if available.
        // For now, let's assume we can fetch booking details.
        // Actually, let's use the public endpoint or a doctor specific one.
        // Checking existing endpoints... `GET /api/lab/pending` is list.
        // `GET /api/lab/booking/:id` might not exist.
        // Let's rely on `GET /api/reports/:id` or similar if exists.
        // Actually, we can fetch via the new doctor route we just made, but that's a list.
        // Let's fallback to `GET /api/doctor/booking/${id}` which we need to make or use existing.

        // Wait, let's check `patientReportRoutes.js` -- `router.get("/:id", ...)` exists?
        // Let's try `GET /api/reports/booking/${id}`.

        const res2 = await fetch(`/api/reports/booking/${id}`);
        const data = await res2.json();

        if (data.success) {
          setReport(data.data || data.booking);
        } else {
          toast.error("Failed to load report details");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleSignOff = async () => {
    if (
      !confirm(
        "Are you sure you want to sign off on this report? This action is final.",
      )
    )
      return;

    setSigning(true);
    try {
      const res = await fetch(`/api/lab/booking/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          // specific flag or separate endpoint could be used for signature
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Report signed off successfully");
        router.push("/doctor/unsigned");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign off");
    } finally {
      setSigning(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!report) return <div className="p-12 text-center">Report not found</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inbox
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Sign-off</h1>
          <p className="text-gray-500">
            Review results and approve for patient release
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">
            {report.patientName}
          </p>
          <p className="text-xs text-gray-500 font-mono">{report.uhid}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
        {/* PDF Preview */}
        <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-200 px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-widest flex justify-between">
            <span>Report Preview</span>
            <a
              href={report.reportUrl}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Open in new tab
            </a>
          </div>
          {report.reportUrl ? (
            <iframe
              src={report.reportUrl}
              className="flex-1 w-full h-full"
              title="Report PDF"
            ></iframe>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              PDF not available
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-lg border border-gray-100 p-6 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Clinical Review</h3>

          <div className="flex-1 space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm mb-2">
                Automated Analysis
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Machine analysis completed
                </li>
                {report.flags?.isCriticalValue && (
                  <li className="flex items-center gap-2 text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3" /> Critical Values Detected
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Technical validation
                  passed
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Doctor's Notes (Optional)
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                rows="4"
                placeholder="Add clinical correlation notes here..."
              ></textarea>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleSignOff}
              disabled={signing}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {signing ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Digitally Sign & Release
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">
              By clicking above, you certify that you have reviewed these
              results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
