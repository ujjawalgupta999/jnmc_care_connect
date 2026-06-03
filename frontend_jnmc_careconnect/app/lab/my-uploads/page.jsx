"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye, Loader2, Calendar, User, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function MyUploadsPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyUploads = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/staff-login");
          return;
        }

        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id || parsedUser._id;

        const res = await fetch(`${API_URL}/lab/my-uploads/${userId}`);
        const data = await res.json();

        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error("Failed to fetch uploads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyUploads();
  }, [router]);

  const filteredReports = reports.filter((report) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (report.patientName || "").toLowerCase().includes(searchLower) ||
      (report.uhid || "").toLowerCase().includes(searchLower) ||
      (report.sampleId || "").toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          My Uploads
        </h2>
        <p className="text-gray-500 mt-1 font-medium">
          History of reports you have processed and uploaded
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search my uploads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                Sample ID
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                Uploaded At
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredReports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-gray-900">
                      {report.patientName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> {report.uhid}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {report.sampleId || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(report.reportUploadedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {report.reportUrl ? (
                    <a
                      href={report.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No PDF</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
