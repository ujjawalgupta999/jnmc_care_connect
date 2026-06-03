"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScanBarcode,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
  Clock,
  CameraOff,
  ImagePlus,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STAGES = ["Sample Collected", "Received by Lab", "Result Released"];

const STAGE_STYLES = {
  "Sample Collected": { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  "Received by Lab":  { badge: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
  "Result Released":  { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

// Input mode tabs
const MODES = [
  { id: "usb",    label: "USB Scanner", icon: ScanBarcode },
  { id: "camera", label: "Camera",      icon: Camera      },
  { id: "upload", label: "Upload Image",icon: ImagePlus   },
];

export default function ScanPage() {
  const [mode, setMode]               = useState("usb");
  const [scanValue, setScanValue]     = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [flash, setFlash]             = useState(null); // 'ok' | 'error' | null

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState(null);
  const [cameras, setCameras]           = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const videoRef  = useRef(null);
  const readerRef = useRef(null);  // ZXing reader instance

  // Upload state
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadResult, setUploadResult]   = useState(null);
  const fileInputRef = useRef(null);

  // Hidden USB input
  const usbInputRef = useRef(null);

  // ── USB mode: keep hidden input focused ───────────────────────────────────
  useEffect(() => {
    if (mode !== "usb") return;
    usbInputRef.current?.focus();
    const refocus = () => {
      if (mode === "usb") usbInputRef.current?.focus();
    };
    document.addEventListener("click", refocus);
    return () => document.removeEventListener("click", refocus);
  }, [mode]);

  // ── Camera: start / stop ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }
  }, [mode]);

  const stopCamera = () => {
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch (_) {}
      readerRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Dynamic import so ZXing only loads client-side
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);
      const deviceId = selectedCamera || devices[0]?.deviceId;
      if (!deviceId) { setCameraError("No camera found."); return; }

      setCameraActive(true);
      await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText();
          stopCamera();
          processBarcode(text.trim().toUpperCase());
        }
      });
    } catch (err) {
      setCameraError(err.message || "Camera access denied.");
      setCameraActive(false);
    }
  };

  // ── Image upload decode ───────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadResult(null);
    setUploadPreview(URL.createObjectURL(file));

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      await new Promise((res) => { img.onload = res; });

      const result = await reader.decodeFromImageElement(img);
      const code = result.getText().trim().toUpperCase();
      setUploadResult({ type: "ok", code });
      processBarcode(code);
    } catch (err) {
      setUploadResult({ type: "error", message: "No barcode detected in image." });
    }
    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Flash feedback ────────────────────────────────────────────────────────
  const triggerFlash = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 900);
  };

  // ── Core: lookup + advance ────────────────────────────────────────────────
  const processBarcode = useCallback(async (sampleId) => {
    if (!sampleId || isProcessing) return;
    setIsProcessing(true);

    try {
      const res  = await fetch(`${API_URL}/lab/booking/by-sample/${encodeURIComponent(sampleId)}`);
      const data = await res.json();

      if (!data.success || !data.booking) {
        triggerFlash("error");
        addHistory({ sampleId, type: "error", message: "Sample not found in system" });
        return;
      }

      const booking     = data.booking;
      const currentStage = booking.status;
      const currentIdx   = STAGES.indexOf(currentStage);

      if (currentIdx === STAGES.length - 1) {
        triggerFlash("error");
        addHistory({
          sampleId, type: "warn",
          patientName: booking.patientName || booking.patientId?.name,
          message: `Already at final stage: ${currentStage}`,
          from: currentStage,
        });
        return;
      }

      const nextStage = currentIdx === -1 ? STAGES[0] : STAGES[currentIdx + 1];
      await advanceStage(booking, currentStage === STAGES[currentIdx] ? currentStage : "–", nextStage, sampleId);
    } catch (err) {
      triggerFlash("error");
      addHistory({ sampleId, type: "error", message: err.message || "Network error" });
    } finally {
      setIsProcessing(false);
      if (mode === "usb") usbInputRef.current?.focus();
    }
  }, [isProcessing, mode]);

  const advanceStage = async (booking, from, to, sampleId) => {
    const res  = await fetch(`${API_URL}/lab/booking/${booking._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Update failed");

    triggerFlash("ok");
    addHistory({
      sampleId, type: "ok",
      patientName: booking.patientName || booking.patientId?.name || "—",
      tests: booking.tests?.map((t) => t.testCode || t.testName).join(" · "),
      from, to,
    });
  };

  const addHistory = (entry) =>
    setScanHistory((prev) => [{ id: Date.now(), time: new Date(), ...entry }, ...prev.slice(0, 19)]);

  // ── USB submit ────────────────────────────────────────────────────────────
  const handleUsbSubmit = () => {
    const val = scanValue.trim().toUpperCase();
    if (!val) return;
    setScanValue("");
    processBarcode(val);
  };

  // ── Mode switch cleanup ───────────────────────────────────────────────────
  const switchMode = (m) => {
    if (mode === "camera") stopCamera();
    setUploadPreview(null);
    setUploadResult(null);
    setScanValue("");
    setMode(m);
  };

  // ── Flash ring colours ────────────────────────────────────────────────────
  const ringClass = flash === "ok"
    ? "ring-2 ring-emerald-400 bg-emerald-50"
    : flash === "error"
    ? "ring-2 ring-red-400 bg-red-50"
    : "bg-white";

  return (
    <div className="min-h-full bg-[#F8FAFC]" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Hidden USB input — always listening */}
      <input
        ref={usbInputRef}
        type="text"
        value={scanValue}
        onChange={(e) => setScanValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && handleUsbSubmit()}
        className="fixed opacity-0 pointer-events-none w-0 h-0"
        aria-label="USB barcode input"
        tabIndex={mode === "usb" ? 0 : -1}
        autoFocus
      />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-100">
            <ScanBarcode className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sample Scanner</h1>
            <p className="text-sm text-slate-500">Scan a barcode to advance the sample stage</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── USB SCANNER MODE ── */}
        {mode === "usb" && (
          <div
            className={`rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
              flash === "ok"
                ? "border-emerald-400 bg-emerald-50"
                : flash === "error"
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => usbInputRef.current?.focus()}
          >
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
              {isProcessing ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">Processing…</p>
                </>
              ) : flash === "ok" ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                  <p className="text-base font-bold text-emerald-700">Stage Updated!</p>
                </>
              ) : flash === "error" ? (
                <>
                  <XCircle className="w-14 h-14 text-red-500" />
                  <p className="text-base font-bold text-red-700">Scan Failed</p>
                </>
              ) : (
                <>
                  <ScanBarcode className="w-14 h-14 text-slate-300" />
                  <div className="text-center">
                    <p className="font-bold text-slate-700 text-lg">Ready for USB Scanner</p>
                    <p className="text-slate-400 text-sm mt-1">Point scanner at barcode — it fires automatically</p>
                  </div>
                  {/* Manual fallback input */}
                  <div className="flex gap-2 mt-2 w-full max-w-sm">
                    <input
                      type="text"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleUsbSubmit()}
                      placeholder="Or type Sample ID…"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUsbSubmit}
                      disabled={!scanValue.trim() || isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                      Go
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CAMERA MODE ── */}
        {mode === "camera" && (
          <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${ringClass}`}>
            {/* Video viewport */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                muted
                playsInline
              />
              {!cameraActive && !cameraError && (
                <div className="flex flex-col items-center gap-3 text-white">
                  <Camera className="w-12 h-12 opacity-40" />
                  <p className="text-sm opacity-60">Camera not started</p>
                </div>
              )}
              {cameraError && (
                <div className="flex flex-col items-center gap-3 text-red-400">
                  <CameraOff className="w-10 h-10" />
                  <p className="text-sm text-center px-6">{cameraError}</p>
                </div>
              )}
              {/* Scan overlay */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-24 border-2 border-blue-400 rounded-lg relative">
                    <div className="absolute inset-x-0 top-1/2 h-[2px] bg-blue-400/70 animate-scan-line-camera" />
                    {/* Corner marks */}
                    {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
                      "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((cls,i)=>(
                      <span key={i} className={`absolute w-4 h-4 border-blue-400 ${cls}`} />
                    ))}
                  </div>
                </div>
              )}
              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
              {flash === "ok" && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </div>
              )}
              {flash === "error" && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-red-400" />
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="p-4 flex items-center gap-3 bg-white flex-wrap">
              {cameras.length > 1 && (
                <select
                  value={selectedCamera}
                  onChange={(e) => { setSelectedCamera(e.target.value); if (cameraActive) { stopCamera(); setTimeout(startCamera, 200); } }}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                >
                  {cameras.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0,6)}`}</option>
                  ))}
                </select>
              )}
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-black transition-all"
                >
                  <CameraOff className="w-4 h-4" /> Stop Camera
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── IMAGE UPLOAD MODE ── */}
        {mode === "upload" && (
          <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${ringClass}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drop zone / preview */}
            <div
              className="relative aspect-video bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadPreview} alt="Barcode" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Upload className="w-12 h-12" />
                  <div className="text-center">
                    <p className="font-bold text-slate-600">Click to upload barcode image</p>
                    <p className="text-sm mt-1">JPG, PNG, WEBP — any image with a Code128 barcode</p>
                  </div>
                </div>
              )}

              {/* Result overlays */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              )}
              {flash === "ok" && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
              )}
              {flash === "error" && uploadResult?.type === "error" && (
                <div className="absolute inset-0 bg-red-500/10 flex flex-col items-center justify-center gap-2">
                  <XCircle className="w-12 h-12 text-red-400" />
                  <p className="text-sm font-bold text-red-500">{uploadResult.message}</p>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="p-4 bg-white flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {uploadResult?.type === "ok"
                  ? <span className="font-mono font-black text-blue-700">{uploadResult.code}</span>
                  : "Upload an image of the sample label"}
              </p>
              <button
                onClick={() => { setUploadPreview(null); setUploadResult(null); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
              >
                <ImagePlus className="w-4 h-4" />
                {uploadPreview ? "Upload Another" : "Upload Image"}
              </button>
            </div>
          </div>
        )}

        {/* ── Scan history ── */}
        {scanHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Scans</p>
              <button
                onClick={() => setScanHistory([])}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-400 font-bold transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="space-y-2">
              {scanHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${
                    entry.type === "ok" ? "bg-white border-emerald-100"
                    : entry.type === "warn" ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {entry.type === "ok"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-800">{entry.sampleId}</span>
                      {entry.type === "ok" && entry.from && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${STAGE_STYLES[entry.from]?.badge || "bg-slate-100 text-slate-600"}`}>
                            {entry.from === "–" ? "Pending" : entry.from}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                          <span className={`px-1.5 py-0.5 rounded font-bold ${STAGE_STYLES[entry.to]?.badge || "bg-slate-100 text-slate-600"}`}>
                            {entry.to}
                          </span>
                        </div>
                      )}
                    </div>
                    {entry.patientName && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {entry.patientName}
                        {entry.tests && <span className="text-slate-400"> · {entry.tests}</span>}
                      </p>
                    )}
                    {entry.message && <p className="text-xs text-red-500 mt-0.5">{entry.message}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {entry.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan-line-camera {
          0%   { transform: translateY(-40px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(40px);  opacity: 0; }
        }
        .animate-scan-line-camera { animation: scan-line-camera 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
