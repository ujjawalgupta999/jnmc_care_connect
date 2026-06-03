"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function UnsignedReports() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnsigned = async () => {
      try {
        if (!user) return;
        // Fetch bookings where referringDoctor.doctorId matches user._id
        // AND status is "Result Released" (or "Awaiting Sign-off")
        // We'll need a new API endpoint or use existing with filters
        const res = await fetch(
          `/api/doctor/unsigned-reports?doctorId=${user.id}`,
        );
        const data = await res.json();

        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Failed to fetch unsigned reports", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnsigned();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Action Required: Unsigned Reports
        </h2>
        <p className="text-amber-700 text-sm mt-1">
          You have {reports.length} reports waiting for your review and digital
          signature.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="font-bold">All caught up!</p>
            <p className="text-sm">No pending reports to sign.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((report) => (
              <div
                key={report._id}
                className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {report.patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {report.patientName}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">
                      {report.uhid}
                    </p>
                  </div>
                </div>

                <div className="text-right mr-8">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Available Since
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(
                      report.tatTimestamps?.resultReleasedAt ||
                        report.updatedAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/doctor/sign-off/${report._id}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                  Review & Sign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
