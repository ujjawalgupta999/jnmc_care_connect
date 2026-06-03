"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  User,
  FileText,
  Eye,
  Upload,
  Filter,
  ChevronRight,
  Beaker,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PendingReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [userDepartment, setUserDepartment] = useState("");
  const [generatingId, setGeneratingId] = useState(null);

  const handleGenerateReport = async (bookingId, sampleId) => {
    // Check if result exists first? No, backend handles it.
    if (!confirm("Fetch results from LIS (Simulated) for this sample?")) return;

    // Get user ID from local storage
    const userData = localStorage.getItem("user");
    let uploadedBy = null;
    let userToken = null;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        uploadedBy = parsed.id || parsed._id;
        userToken = parsed.token;
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    setGeneratingId(bookingId);
    try {
      // Step 1: Simulate Results from Gemini (med_sim)
      // Note: med_sim runs on port 6661
      const medSimUrl = "http://localhost:6661/api/simulate";

      const simRes = await fetch(medSimUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // isAbnormal: false for now, can be a checkbox later
        body: JSON.stringify({ bookingId, testIndex: 0, isAbnormal: false }),
      });

      const simData = await simRes.json();

      if (!simData.success) {
        throw new Error("Simulation failed: " + simData.error);
      }

      console.log("Simulated Data:", simData);

      // Step 2: Save Results to Backend LIS DB
      // We map Gemini results to LisTestResult schema format
      // simData.results is [{ name, value, unit, referenceRange, flag }]
      // LisTestResult expects [{ parameter, value, unit, flag, refRange }]

      const mappedResults = simData.results.map((r) => ({
        parameter: r.name,
        value: r.value,
        unit: r.unit,
        flag: r.flag,
        refRange: r.referenceRange,
      }));

      const saveRes = await fetch(`${API_URL}/lab/save-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${userToken}` // If needed
        },
        body: JSON.stringify({
          bookingId,
          sampleId,
          results: mappedResults,
          testDate: new Date(),
          uhid: simData.booking.uhid,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveData.success) {
        throw new Error("Failed to save LIS results: " + saveData.message);
      }

      // Step 3: Generate the Report (PDF)
      const res = await fetch(`${API_URL}/lab/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, sampleId, uploadedBy }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Results simulated, saved & report generated successfully!");
        // Refresh list
        setReports((prev) => prev.filter((r) => r._id !== bookingId));
        // Optionally redirect to view report or show link
      } else {
        alert("Report Generation Failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing report: " + err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Get lab assistant's department from localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);
        const department = parsedUser.department || "All";
        console.log("Frontend: User Department:", department);

        // Capitalize first letter for display if it's not "All"
        const displayDepartment =
          department !== "All"
            ? department.charAt(0).toUpperCase() + department.slice(1)
            : department;
        setUserDepartment(displayDepartment);

        // Fetch ALL pending reports to ensure the list isn't empty (bypassing strict department filter for now)
        console.log(
          `Frontend: Fetching all reports (ignoring user department filter for better visibility)`,
        );
        const res = await fetch(`${API_URL}/lab/pending?department=All&all_active=true`);
        const data = await res.json();
        console.log("Frontend: Pending reports response:", data);

        if (data.success) {
          setReports(data.bookings);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const patientName =
      report.patientId?.name || report.patientName || "Unknown";
    const uhid = report.patientId?.uhid || report.uhid || "";
    const sampleId = report.sampleId || "";

    const matchesSearch =
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sampleId.toLowerCase().includes(searchQuery.toLowerCase());

    // Priority filter - currently we don't have priority in backend, assuming "Normal" for now
    // or we can map test turnaround time to priority if available
    const matchesPriority = filterPriority === "all"; // Implement real priority logic if field exists

    return matchesSearch && matchesPriority;
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const collected = new Date(dateString);
    const diffMs = now - collected;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Pending Reports
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            {filteredReports.length} reports awaiting processing
            {userDepartment && (
              <span className="ml-1 text-gray-400">({userDepartment})</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-none bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">
              {/* Placeholder for urgent count */}0 Urgent
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-none border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            <input
              type="text"
              placeholder="Search by patient name, UHID, or sample ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-bold transition-all"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {["all", "urgent", "normal"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={cn(
                    "px-4 py-2 rounded-none text-sm font-bold transition-all",
                    filterPriority === priority
                      ? "bg-gray-900 text-white shadow-lg"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center text-gray-400">
              <Beaker className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Sample Queue</h3>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Sorted by collection time
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Patient
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Tests
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Sample ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Collected
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReports.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50/30 transition-colors group"
                >
                  {/* Patient */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-black">
                        {(report.patientId?.name || report.patientName || "UN")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {report.patientId?.name || report.patientName}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400">
                          {report.patientId?.uhid || report.uhid} •{" "}
                          {report.patientId?.age || "?"}Y /{" "}
                          {report.patientId?.gender || "?"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Test */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      {report.tests.map((test, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {/* Highlight test if it matches user department */}
                          <span
                            className={cn(
                              "text-sm font-bold",
                              userDepartment &&
                                test.testId?.department?.toLowerCase() ===
                                  userDepartment.toLowerCase()
                                ? "text-gray-900"
                                : "text-gray-500",
                            )}
                          >
                            {test.testName}
                          </span>
                          <span className="text-[10px] text-gray-300 font-mono">
                            {test.testCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Sample ID */}
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-gray-500 font-mono tracking-tighter">
                      {report.sampleId}
                    </p>
                  </td>

                  {/* Collected */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {formatTime(report.createdAt)}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400">
                          {formatDate(report.createdAt)} •{" "}
                          {getTimeAgo(report.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest",
                        report.status === "Processing"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600",
                      )}
                    >
                      {report.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      {/* Workflow Actions */}
                      {report.status === "Pending" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `${API_URL}/lab/booking/${report._id}/status`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    status: "Sample Collected",
                                  }),
                                },
                              );
                              if (res.ok) {
                                // Optimistic Update
                                setReports((prev) =>
                                  prev.map((r) =>
                                    r._id === report._id
                                      ? { ...r, status: "Sample Collected" }
                                      : r,
                                  ),
                                );
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          Mark Collected
                        </button>
                      )}

                      {report.status === "Sample Collected" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `${API_URL}/lab/booking/${report._id}/status`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    status: "Received by Lab",
                                  }),
                                },
                              );
                              if (res.ok) {
                                setReports((prev) =>
                                  prev.map((r) =>
                                    r._id === report._id
                                      ? { ...r, status: "Received by Lab" }
                                      : r,
                                  ),
                                );
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-200"
                        >
                          Receive in Lab
                        </button>
                      )}

                      {/* Existing Actions */}
                      {/* <button
                        onClick={() =>
                          handleGenerateReport(report._id, report.sampleId)
                        }
                        disabled={generatingId === report._id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Fetch results from Lab Machine"
                      >
                        {generatingId === report._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Beaker className="w-3.5 h-3.5" />
                        )}
                        Fetch Results
                      </button> */}

                      <button
                        onClick={() =>
                          router.push(`/lab/upload?bookingId=${report._id}`)
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-gray-900 text-white text-xs font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex w-16 h-16 rounded-none bg-gray-50 items-center justify-center text-gray-300 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-bold">No pending reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "All caught up! Great job."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
