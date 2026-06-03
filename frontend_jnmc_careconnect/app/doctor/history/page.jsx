"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  User,
  IdCard,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Pill,
  Plus,
  Trash2,
  Eye,
  History,
} from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { searchPatientReports, addMedication } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gray-200"></div>
        <div className="h-4 w-32 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

// Wrap the page export with Suspense
export default function PatientHistory() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PatientHistoryContent />
    </Suspense>
  );
}

function PatientHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Get 'id' from URL (unified identifier)
  const identifier = searchParams.get("id") || searchParams.get("uhid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Medication State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    dosage: "",
    instructions: "",
  });
  const [submittingMedication, setSubmittingMedication] = useState(false);
  const [stagedMedications, setStagedMedications] = useState([]);

  // Last Prescription State
  const [isViewLastModalOpen, setIsViewLastModalOpen] = useState(false);
  const [lastPrescription, setLastPrescription] = useState([]);

  useEffect(() => {
    if (identifier) {
      fetchPatientHistory(identifier);
    } else {
      setLoading(false);
      setError("No Patient Identifier provided");
    }
  }, [identifier]);

  const fetchPatientHistory = async (searchId) => {
    try {
      setLoading(true);
      setError(null);
      // API now accepts 'identifier' which matches backend expectation
      const data = await searchPatientReports(searchId);

      if (data.success) {
        setPatientData(data);
      } else {
        setError(data.message || "Failed to fetch patient history");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(
        `/doctor/history?id=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const handleOpenMedicationModal = (booking) => {
    setSelectedBooking(booking);
    setMedicationForm({ name: "", dosage: "", instructions: "" });
    setStagedMedications([]);
    setIsMedicationModalOpen(true);
  };

  const handleAddToList = () => {
    if (!medicationForm.name) {
      toast.error("Medication name is required");
      return;
    }
    setStagedMedications([...stagedMedications, { ...medicationForm }]);
    setMedicationForm({ name: "", dosage: "", instructions: "" });
  };

  const handleRemoveFromList = (index) => {
    const newList = [...stagedMedications];
    newList.splice(index, 1);
    setStagedMedications(newList);
  };

  const handleMedicationSubmit = async () => {
    // If there is data in form but not in list, add it to list effectively
    let finalMedications = [...stagedMedications];
    if (medicationForm.name) {
      finalMedications.push(medicationForm);
    }

    if (finalMedications.length === 0) {
      toast.error("Please add at least one medication");
      return;
    }

    try {
      setSubmittingMedication(true);
      // Send array of medications
      const res = await addMedication(selectedBooking._id, finalMedications);

      if (res.success) {
        toast.success("Medications added successfully");
        setIsMedicationModalOpen(false);
        // Refresh data to show new medication
        fetchPatientHistory(identifier);
      } else {
        toast.error(res.message || "Failed to add medication");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setSubmittingMedication(false);
    }
  };

  const handleViewLastPrescription = () => {
    if (!bookings || bookings.length === 0) {
      toast.info("No history available");
      return;
    }

    // 1. Collect ALL medications from ALL bookings into a single flat array
    const allMeds = bookings.flatMap((b) => b.medications || []);

    if (allMeds.length === 0) {
      toast.info("No previous prescriptions found for this patient");
      return;
    }

    // 2. Sort by prescribedAt descending (latest first)
    allMeds.sort((a, b) => new Date(b.prescribedAt) - new Date(a.prescribedAt));

    // 3. Get the latest timestamp
    const latestDate = new Date(allMeds[0].prescribedAt);

    // 4. Filter all meds that match this timestamp (with 1-second tolerance for legacy data)
    const recentPrescription = allMeds.filter((med) => {
      const d = new Date(med.prescribedAt);
      return Math.abs(d - latestDate) < 1000; // 1 second diff max
    });

    setLastPrescription(recentPrescription);
    setIsViewLastModalOpen(true);
  };

  // Helper function for status styling
  const getStatusStyles = (status) => {
    const base = "px-3 py-1 rounded-full text-[11px] font-bold border-none";
    switch (status) {
      case "Completed":
      case "Verified":
        return `${base} bg-emerald-50 text-emerald-600`;
      case "Pending":
        return `${base} bg-orange-50 text-orange-600`;
      case "Processing":
      case "Sample Collected":
        return `${base} bg-blue-50 text-blue-600`;
      case "Cancelled":
        return `${base} bg-red-50 text-red-600`;
      default:
        return base;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200"></div>
          <div className="h-4 w-32 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center p-6">
        <div className="rounded-full bg-red-50 p-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Unable to Load Patient
        </h2>
        <p className="max-w-md text-gray-500">{error}</p>
        <button
          onClick={() => router.push("/doctor")}
          className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Go Back to Search
        </button>
      </div>
    );
  }

  if (!patientData) return null;

  const { patient, bookings } = patientData;
  const patientName = patient?.name || patient?.studentName || "Unknown";
  const patientPhone = patient?.phone || patient?.mobileNumber || "N/A";
  const patientUhid = patient?.uhid || identifier;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search another UHID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <User className="h-10 w-10 text-gray-300" />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {patientName}
          </h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              <span>
                UHID:{" "}
                <span className="text-gray-900 font-bold uppercase tracking-tight">
                  {patientUhid}
                </span>
              </span>
            </div>
            {patient?.aadharNumber && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Aadhaar:{" "}
                  <span className="text-gray-900 font-bold">
                    {patient.aadharNumber}
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{patientPhone}</span>
            </div>
          </div>
        </div>

        {/* Global Prescribe Button (Uses latest booking if available) */}
        {bookings.length > 0 && (
          <div className="md:ml-auto">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                onClick={handleViewLastPrescription}
              >
                <History className="h-4 w-4" /> View Last Prescription
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 flex items-center gap-2"
                onClick={() => handleOpenMedicationModal(bookings[0])}
              >
                <Plus className="h-4 w-4" /> Prescribe Medication
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Records Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">
          Test History ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">
              No test history found for this patient.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Sample Metadata Bar */}
                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Sample ID:
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {booking.sampleId || "N/A"}
                    </span>
                    {booking.receiptNo && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Receipt: {booking.receiptNo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(booking.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Individual Tests */}
                <div className="divide-y divide-gray-50">
                  {booking.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-all group"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {test.testName}
                        </p>
                        <p className="text-xs font-medium text-gray-400">
                          {test.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={getStatusStyles(booking.status)}>
                          {booking.status}
                        </span>

                        {/* If report is available, show link */}
                        {booking.reportUrl ? (
                          <a
                            href={booking.reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-3 w-3" />
                            View Report
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No Report
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medication Modal */}
      {isMedicationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">
                Prescribe Medication
              </h3>
              <button
                onClick={() => setIsMedicationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Left Side: Input Form */}
                <div className="flex flex-col h-full">
                  <div className="space-y-5 flex-1">
                    <div className="space-y-2">
                      <Label
                        htmlFor="med-name"
                        className="text-gray-700 font-medium"
                      >
                        Medication Name
                      </Label>
                      <Input
                        id="med-name"
                        placeholder="e.g. Paracetamol 500mg"
                        value={medicationForm.name}
                        onChange={(e) =>
                          setMedicationForm({
                            ...medicationForm,
                            name: e.target.value,
                          })
                        }
                        autoFocus
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="med-dosage"
                        className="text-gray-700 font-medium"
                      >
                        Dosage / Frequency
                      </Label>
                      <Input
                        id="med-dosage"
                        placeholder="e.g. 1-0-1 after food"
                        value={medicationForm.dosage}
                        onChange={(e) =>
                          setMedicationForm({
                            ...medicationForm,
                            dosage: e.target.value,
                          })
                        }
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="med-instructions"
                        className="text-gray-700 font-medium"
                      >
                        Special Instructions
                      </Label>
                      <Input
                        id="med-instructions"
                        placeholder="e.g. Take with warm water"
                        value={medicationForm.instructions}
                        onChange={(e) =>
                          setMedicationForm({
                            ...medicationForm,
                            instructions: e.target.value,
                          })
                        }
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToList}
                    className="w-full border-dashed border-2 border-gray-200 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 mt-6 h-12"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add to List
                  </Button>
                </div>

                {/* Right Side: Preview List */}
                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 flex flex-col h-full min-h-[300px]">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <FileText className="h-4 w-4 text-blue-500" /> Prescription
                    Preview
                  </h4>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 theme-scrollbar">
                    {stagedMedications.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                        <Pill className="h-8 w-8 mb-2 opacity-20" />
                        No medications added yet
                      </div>
                    ) : (
                      stagedMedications.map((med, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start group hover:border-blue-200 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-gray-900">
                              {med.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                              {med.dosage && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-gray-700">
                                    Dosage:
                                  </span>{" "}
                                  {med.dosage}
                                </div>
                              )}
                              {med.instructions && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-gray-700">
                                    Note:
                                  </span>{" "}
                                  {med.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromList(idx)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-md"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {stagedMedications.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200 text-right text-xs text-gray-500 font-medium">
                      Total Items: {stagedMedications.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsMedicationModalOpen(false)}
                className="hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMedicationSubmit}
                className="bg-black hover:bg-gray-800 text-white px-8 shadow-lg shadow-gray-200"
                disabled={
                  submittingMedication || stagedMedications.length === 0
                }
              >
                {submittingMedication ? "Sending..." : "Send Prescription"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Last Prescription Modal */}
      {isViewLastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" /> Last Prescription
              </h3>
              <button
                onClick={() => setIsViewLastModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {lastPrescription.length > 0 ? (
                <div className="space-y-3">
                  {lastPrescription.map((med, i) => (
                    <div
                      key={i}
                      className="flex flex-col bg-white border border-gray-100 p-3 rounded-lg shadow-sm"
                    >
                      <div className="font-bold text-gray-900">{med.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Dosage:</span>{" "}
                        {med.dosage || "N/A"}
                      </div>
                      {med.instructions && (
                        <div className="text-sm text-gray-500 italic mt-1">
                          Note: {med.instructions}
                        </div>
                      )}
                      <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-50">
                        Prescribed:{" "}
                        {new Date(med.prescribedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No details available.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <Button onClick={() => setIsViewLastModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
