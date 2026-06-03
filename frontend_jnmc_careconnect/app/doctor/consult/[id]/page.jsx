"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Pill,
  Clock,
  FileText,
  User,
  Activity,
  CheckCircle2,
  Stethoscope,
  Info,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner";
import { addMedication } from "../../../../lib/api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ConsultPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState([
    { name: "", dosage: "", instructions: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/lab/booking/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.data.success) {
          setBooking(response.data.booking);
          if (
            response.data.booking.medications &&
            response.data.booking.medications.length > 0
          ) {
            setMedications(response.data.booking.medications);
          }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleAddRow = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", instructions: "" },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (medications.length === 1) {
      setMedications([{ name: "", dosage: "", instructions: "" }]);
      return;
    }
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  const handleInputChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleSave = async () => {
    const validMedications = medications.filter((m) => m.name.trim() !== "");
    if (validMedications.length === 0) {
      toast.error("Please add at least one medication name");
      return;
    }

    setSaving(true);
    try {
      // Backend only supports adding one medication at a time (push logic)
      // We loop through and save each one
      for (const med of validMedications) {
        await addMedication(bookingId, med);
      }

      toast.success("Prescription saved successfully");
      router.back();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save prescription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-blue-600 animate-pulse" />
          <p className="text-gray-500 font-bold animate-pulse">
            Loading Consultation Room...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-xl bg-white/80">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Consultation
            </h1>
            <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5 translate-y-[-2px]">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl font-black h-12 bg-gray-900 hover:bg-black text-white px-8 shadow-xl shadow-gray-200 transition-all active:scale-95"
        >
          {saving ? (
            <Activity className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Finalize Prescription
        </Button>
      </div>

      {/* Patient Card */}
      {booking && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-start gap-6 group">
            <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <User className="h-10 w-10" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 leading-none">
                  {booking.patientName}
                </h3>
                <p className="text-sm font-bold text-gray-400">
                  UHID: {booking.uhid}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100">
                  {booking.patientId?.gender || "Male"} •{" "}
                  {booking.patientId?.age || "--"} Years
                </div>
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  REF: {booking.sampleId}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[32px] text-white space-y-4 shadow-2xl shadow-gray-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-black tracking-tight">
                Prescribing Doctor
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">
                {booking.referringDoctor?.name}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {booking.referringDoctor?.department}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Form */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              Medication Regimen
            </h2>
          </div>
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {medications.map((med, index) => (
            <div
              key={index}
              className="group relative bg-gray-50/50 rounded-3xl border border-gray-100 p-6 md:p-8 space-y-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100 active:border-blue-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol 500mg"
                    value={med.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                    className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Dosage / Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-0-1 (After Meals)"
                    value={med.dosage}
                    onChange={(e) =>
                      handleInputChange(index, "dosage", e.target.value)
                    }
                    className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Specific Instructions
                  </label>
                  <textarea
                    placeholder="Provide detailed administration instructions here..."
                    rows={2}
                    value={med.instructions}
                    onChange={(e) =>
                      handleInputChange(index, "instructions", e.target.value)
                    }
                    className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => handleRemoveRow(index)}
                className="absolute -top-3 -right-3 h-10 w-10 bg-white shadow-lg border border-red-50 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all scale-0 group-hover:scale-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {medications.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-100 rounded-[32px]">
              <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Info className="h-8 w-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold max-w-xs">
                No medications added yet. Click the "Add Medication" button to
                begin your prescription.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 text-gray-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          Secure Medical Consultation System
        </span>
      </div>
    </div>
  );
}
