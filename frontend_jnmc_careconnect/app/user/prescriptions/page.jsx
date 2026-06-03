"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FileText,
  Activity,
  User,
} from "lucide-react";
import { getPatientPrescriptions } from "../../../lib/api";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedAuth = localStorage.getItem("patientAuth");
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        const uhid = parsed.patient?.uhid;

        if (uhid) {
          const response = await getPatientPrescriptions(uhid);
          if (response.success) {
            setPrescriptions(response.prescriptions);
          }
        } else {
          setError("UHID not found for this user.");
        }
      } else {
        setError("Please login to view prescriptions.");
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError("Failed to load prescriptions. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.referringDoctor?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.medications.some((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            My Prescriptions
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Click on a prescription to view all medicines prescribed.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by doctor or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Activity className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading prescriptions...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium text-center">
          {error}
        </div>
      ) : filteredPrescriptions.length > 0 ? (
        <div className="space-y-4">
          {filteredPrescriptions.map((booking, idx) => {
            const isExpanded = expandedId === booking._id;
            return (
              <div
                key={booking._id || idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Prescription Header - Clickable */}
                <button
                  onClick={() => toggleExpand(booking._id || idx)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Dr. {booking.referringDoctor?.name || "Unknown Doctor"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(booking.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                          <Pill className="h-3.5 w-3.5" />
                          {booking.medications.length} medicine
                          {booking.medications.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {isExpanded ? "Hide" : "View"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Medications - Expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                      Prescribed Medications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {booking.medications.map((med, midx) => (
                        <div
                          key={midx}
                          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                              <Pill className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">
                                {med.name}
                              </p>
                              <p className="text-sm font-bold text-indigo-600 mt-0.5">
                                {med.dosage || "—"}
                              </p>
                              {med.instructions && (
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/20">
          <div className="h-16 w-16 bg-white shadow-xl shadow-gray-100 rounded-2xl flex items-center justify-center">
            <Pill className="h-8 w-8 text-gray-300" />
          </div>
          <div className="space-y-1">
            <p className="text-gray-900 font-black text-lg">
              No Prescriptions Found
            </p>
            <p className="text-gray-500 font-medium max-w-xs">
              {searchTerm
                ? "Try adjusting your search filters."
                : "Your prescriptions will appear here once prescribed by a doctor."}
            </p>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
