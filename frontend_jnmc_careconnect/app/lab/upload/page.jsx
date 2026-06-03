"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  CloudUpload,
  FileText,
  Eye,
  Send,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ScanText,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function UploadReportPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UploadReportPageContent />
    </Suspense>
  );
}

function UploadReportPageContent() {
  const searchParams = useSearchParams();
  const useRouterHook = useRouter();
  const { user } = useAuth();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/lab/booking/${bookingId}`);
        const data = await res.json();
        if (data.success) {
          setBooking(data.booking);
        } else {
          setError("Failed to load booking details");
        }
      } catch (err) {
        console.error(err);
        setError("Network error loading booking");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfPreviewUrl(null);
    }
  }, [file]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      alert("File size must be less than 5MB");
      return;
    }
    setFile(file);
  };

  const handleImageChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      if (!imgFile.type.startsWith("image/")) {
        alert("Only image files are allowed for OCR");
        return;
      }
      
      setOcrProcessing(true);
      const formData = new FormData();
      formData.append("image", imgFile);
      formData.append("patientName", booking.patientId?.name || booking.patientName || "Unknown");
      formData.append("uhid", booking.patientId?.uhid || booking.uhid || "Unknown");
      formData.append("age", booking.patientId?.age || "?");
      formData.append("gender", booking.patientId?.gender || "?");
      formData.append("sampleId", booking.sampleId || "Unknown");
      formData.append("doctor", booking.referringDoctor?.name || "Self");
      formData.append("tests", booking.tests?.map((t) => t.testName).join(", ") || "Unknown");

      try {
        const res = await fetch(`${API_URL}/lab/ocr-to-pdf`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const blob = await res.blob();
          const pdfFile = new File([blob], `OCR_Report_${bookingId}.pdf`, { type: "application/pdf" });
          setFile(pdfFile);
          alert("OCR completed and PDF generated successfully!");
        } else {
          try {
             const errData = await res.json();
             alert(errData.message || "Failed to process OCR");
          } catch(e) {
             alert("Failed to process OCR (Server error)");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Network error during OCR processing");
      } finally {
        setOcrProcessing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !bookingId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("report", file);
    if (user?.id) {
      formData.append("uploadedBy", user.id); // Send logged-in employee ID
    }

    try {
      const res = await fetch(`${API_URL}/lab/upload-report/${bookingId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Success!
        alert("Report uploaded successfully!");
        useRouterHook.push("/lab/pending");
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && error !== "Booking ID is missing" || !booking && bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-900">
          Booking Not Found
        </h2>
        <p className="text-gray-500 font-medium text-center max-w-md">
          {error || "Could not load the details for this booking."}
        </p>
        <button
          onClick={() => useRouterHook.back()}
          className="mt-4 px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!bookingId) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Select Report to Upload
            </h2>
            <p className="text-gray-500 mt-1 font-medium">
              Please choose a pending report from the list below to proceed.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
                <FileText className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-gray-900">No Booking Selected</h3>
             <p className="text-gray-500 font-medium max-w-md">
               You need to select a specific report before you can upload the PDF file.
             </p>
             <button
                onClick={() => useRouterHook.push("/lab/pending")}
                className="mt-4 px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
              >
                View Pending Reports List
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Upload Patient Report
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Verify patient details and upload the final report PDF.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => useRouterHook.back()}
            className="px-6 py-2.5 rounded-xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-white hover:shadow-sm transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* 1. Patient Information (Read-Only) */}
      <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm space-y-8 opacity-80 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-black">
            1
          </div>
          <h3 className="font-bold text-gray-900">Patient Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
              UHID
            </label>
            <div className="px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700">
              {booking.patientId?.uhid || booking.uhid}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Patient Name
            </label>
            <div className="px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700">
              {booking.patientId?.name || booking.patientName}
            </div>
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Age / Gender
            </label>
            <div className="px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700">
              {booking.patientId?.age || "?"} Y /{" "}
              {booking.patientId?.gender || "?"}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Sample ID
            </label>
            <div className="px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700 font-mono">
              {booking.sampleId}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Referring Doctor
            </label>
            <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              {booking.referringDoctor?.name || "Unknown"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Test Details (Read-Only context) */}
      <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-black">
            2
          </div>
          <h3 className="font-bold text-gray-900">Tests Requested</h3>
        </div>
        <div className="space-y-3">
          {booking.tests.map((test, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50"
            >
              <div>
                <p className="font-bold text-gray-900">{test.testName}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {test.testCode}
                </p>
              </div>
              {/* If we had department info populated in booking.tests, we could show it */}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Upload Report (PDF Only) */}
      <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-black">
            3
          </div>
          <h3 className="font-bold text-gray-900">Upload Report (PDF)</h3>
        </div>

        {!file ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center text-center space-y-4 transition-all cursor-pointer group",
              dragActive
                ? "border-gray-900 bg-gray-50"
                : "border-gray-100 hover:border-gray-200",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleChange}
            />
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
              <CloudUpload className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF only (MAX. 5MB)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-green-100 bg-green-50/30 rounded-[32px] p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Reject / Remove File"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {pdfPreviewUrl && (
              <div className="w-full h-[600px] border border-gray-200 rounded-3xl overflow-hidden bg-gray-50 shadow-inner">
                <iframe src={`${pdfPreviewUrl}#view=FitH`} className="w-full h-full" title="PDF Preview" />
              </div>
            )}
          </div>
        )}

        {!file && (
          <>
            <div className="flex items-center gap-4 w-full mt-4">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <div className="flex justify-center mt-4">
              <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={ocrProcessing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 group w-full justify-center"
              >
                {ocrProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ScanText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {ocrProcessing ? "Processing OCR..." : "Upload Image for OCR (Auto Convert to PDF)"}
              </button>
            </div>
          </>
        )}

      </div>

      {/* Final Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gray-900 text-white font-bold shadow-2xl shadow-gray-300 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Send className="w-4 h-4 text-gray-400 group-hover:text-white" />
          )}
          {uploading ? "Uploading..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
