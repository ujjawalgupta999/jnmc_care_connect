"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Search,
  Trash2,
  CreditCard,
  Wallet,
  Smartphone,
  Printer,
  QrCode,
  Calculator,
  ScanLine,
  Loader2,
  CheckCircle,
  Stethoscope,
} from "lucide-react";
import {
  fetchLabTests,
  fetchDoctors,
  previewLabBooking,
  confirmLabBooking,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

// ---------------------------------------------------------------------------
// Barcode component — renders a Code128 barcode via JsBarcode into an SVG ref.
// Used on the printed sample label as the scan-to-track identifier.
// ---------------------------------------------------------------------------
function Barcode({ value, width = 1.5, height = 40, fontSize = 10 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    // Dynamically import so the module is only loaded client-side
    import("jsbarcode").then(({ default: JsBarcode }) => {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width,
        height,
        fontSize,
        displayValue: true,
        textMargin: 2,
        margin: 4,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
  }, [value, width, height, fontSize]);

  if (!value) return null;
  return <svg ref={svgRef} />;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const searchParams = useSearchParams();

  // Patient data from URL params
  const patientId = searchParams.get("patientId") || "";
  const patientName = searchParams.get("name") || "Unknown Patient";
  const patientUhid = searchParams.get("uhid") || "";
  const patientType = searchParams.get("type") || "General";

  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [mobileNumber, setMobileNumber] = useState(
    searchParams.get("phone") || "",
  );

  // Preview IDs (shown before payment)
  const [previewIds, setPreviewIds] = useState(null);
  const [printMode, setPrintMode] = useState("receipt"); // "receipt" | "label"

  // Collector (logged-in lab employee)
  const [collectorName, setCollectorName] = useState("Lab Staff");

  // Doctor search and selection
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Dynamic charges based on patient type
  // Student & Employee → FREE, General → Test prices + Hospital charges
  const isFreeCategory =
    patientType === "Student" || patientType === "Employee";
  const hospitalCharges = isFreeCategory ? 0 : 15;
  const subtotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const totalAmount = isFreeCategory ? 0 : subtotal + hospitalCharges;

  // Fetch tests on mount
  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLabTests();
        if (data.success) {
          // Map backend field names to frontend format
          const mappedTests = data.tests.map((t) => ({
            _id: t._id,
            name: t.testName,
            code: t.testCode,
            price: t.priceINR,
          }));
          setAvailableTests(mappedTests);
        }
      } catch (err) {
        console.error("Failed to fetch tests:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTests();
  }, []);

  // Fetch doctors on mount and get collector name from localStorage
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await fetchDoctors();
        if (data.success) {
          setAvailableDoctors(data.doctors);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    loadDoctors();

    // Get logged-in lab employee name
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.name) setCollectorName(user.name);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  // Fetch preview IDs when tests are added or patient name is available
  useEffect(() => {
    const loadPreviewIds = async () => {
      if (selectedTests.length > 0 && patientName) {
        try {
          const preview = await previewLabBooking(patientName);
          if (preview.success) {
            setPreviewIds(preview);
          }
        } catch (err) {
          console.error("Failed to get preview IDs:", err);
        }
      } else {
        setPreviewIds(null);
      }
    };
    loadPreviewIds();
  }, [selectedTests.length, patientName]);

  // Filter doctors based on search
  const filteredDoctors = availableDoctors.filter(
    (doc) =>
      doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(doctorSearchQuery.toLowerCase()),
  );

  // Filter tests based on search
  const filteredTests = availableTests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addTest = (test) => {
    if (!selectedTests.find((t) => t._id === test._id)) {
      setSelectedTests([...selectedTests, test]);
    }
    setSearchQuery("");
  };

  const removeTest = (testId) => {
    setSelectedTests(selectedTests.filter((t) => t._id !== testId));
  };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Pay Now - confirms and saves to DB
  const handlePayNow = async () => {
    // Validation Alerts
    if (!patientId) {
      alert("Error: Patient ID is missing. Please restart the booking.");
      return;
    }

    if (selectedTests.length === 0) {
      alert("Please select at least one test to proceed.");
      return;
    }

    if (!selectedDoctor) {
      alert("Please select a Referring Doctor.");
      return;
    }

    setIsSubmitting(true);

    if (paymentMode === "online") {
      try {
        const res = await loadRazorpayScript();

        if (!res) {
          alert("Razorpay SDK failed to load. Are you online?");
          setIsSubmitting(false);
          return;
        }

        // 1. Create Order
        const orderData = await createRazorpayOrder(
          totalAmount,
          previewIds?.receiptNo,
        );

        if (!orderData.success) {
          alert("Failed to create order. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const { amount, id: order_id, currency } = orderData.order;
        const { key_id } = orderData;

        // 2. Open Razorpay Options
        const options = {
          key: key_id,
          amount: amount.toString(),
          currency: currency,
          name: "JNMC Pathology",
          description: "Lab Test Booking",
          order_id: order_id,
          handler: async function (response) {
            // 3. Verify Payment & Confirm Booking
            try {
              await submitBooking({
                paymentStatus: "Paid",
                paymentDetails: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
            } catch (error) {
              console.error("Payment Success Handling Failed", error);
              alert("Payment successful but booking failed. Contact Admin.");
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: patientName,
            contact: mobileNumber,
          },
          notes: {
            address: "JNMC, Aligarh",
            uhid: patientUhid,
          },
          theme: {
            color: "#111827",
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        console.error("Payment Flow Error:", err);
        alert("Something went wrong with payment initialization.");
        setIsSubmitting(false);
      }
    } else {
      // Cash Payment
      // For cash, status is Paid immediately
      await submitBooking({ paymentStatus: "Paid" });
    }
  };

  const submitBooking = async (extraData = {}) => {
    try {
      const bookingData = {
        patientId,
        patientType,
        uhid: patientUhid,
        patientName,
        tests: selectedTests.map((t) => ({
          testId: t._id,
          testName: t.name,
          testCode: t.code,
          price: t.price,
        })),
        totalAmount,
        paymentMode,
        collectorName,
        referringDoctor: selectedDoctor
          ? {
              doctorId: selectedDoctor._id,
              name: selectedDoctor.name,
              department: selectedDoctor.department,
            }
          : null,
        ...extraData,
      };

      const result = await confirmLabBooking(bookingData);
      if (result.success) {
        setBookingResult(result);
      } else {
        // Show specific error from backend if available
        alert(result.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Booking failed:", err);
      // Try to show more details from the error object if possible, though err.message usually generic for fetch
      alert(err.message || "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for receipt
  const currentDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-20">
      {/* Left Column: Form and Selection */}
      <div className="flex-1 space-y-8 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            New Bill / Booking
          </h2>
          {bookingResult && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-none">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold">Booking Created!</span>
            </div>
          )}
        </div>

        {/* Patient Information */}
        <div className="bg-white rounded-none border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 border-b-2 border-transparent">
              Patient Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Mobile Number *
              </label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                  className="w-full pl-11 pr-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-bold transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                UHID
              </label>
              <input
                type="text"
                value={patientUhid}
                readOnly
                className="w-full px-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent text-sm font-bold text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Patient Name *
              </label>
              <input
                type="text"
                value={patientName}
                readOnly
                className="w-full px-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent text-sm font-bold text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Test Selection */}
        <div className="bg-white rounded-none border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center text-gray-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Test Selection</h3>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Search & Add Tests
              </label>
              <div className="relative">
                <div className="flex gap-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type test name (e.g., CBC, Lipid Profile, Glucose)..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {searchQuery && filteredTests.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-none shadow-xl max-h-60 overflow-y-auto">
                    {filteredTests.slice(0, 8).map((test) => (
                      <button
                        key={test._id}
                        onClick={() => addTest(test)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-gray-900 text-sm">
                            {test.name}
                          </span>
                          <span className="ml-2 text-[10px] text-gray-400 uppercase">
                            {test.code}
                          </span>
                        </div>
                        <span className="font-black text-gray-700">
                          ₹{test.price}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-50 rounded-none overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Test Name
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Code
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Price (₹)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedTests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400 text-sm"
                      >
                        No tests selected. Search and add tests above.
                      </td>
                    </tr>
                  ) : (
                    selectedTests.map((test) => (
                      <tr
                        key={test._id}
                        className="hover:bg-gray-50/30 transition-colors"
                      >
                        <td className="px-6 py-5 text-sm font-bold text-gray-900">
                          {test.name}
                        </td>
                        <td className="px-6 py-5 text-[11px] font-black text-gray-500 uppercase tracking-tighter">
                          {test.code}
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-gray-900">
                          {test.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => removeTest(test._id)}
                            className="p-2 rounded-none text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10 pt-10 border-t border-gray-50">
            {!isFreeCategory && (
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Payment Mode
                </label>
                <div className="flex gap-3">
                  {[
                    { id: "cash", label: "Cash", icon: Wallet },
                    { id: "online", label: "Online", icon: CreditCard },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-none border transition-all",
                        paymentMode === mode.id
                          ? "bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200"
                          : "bg-white text-gray-500 border-gray-100 hover:border-gray-200",
                      )}
                    >
                      <mode.icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Referring Doctor */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Referring Doctor *
              </label>
              <div className="relative">
                <div className="relative group">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                  <input
                    type="text"
                    value={
                      selectedDoctor ? selectedDoctor.name : doctorSearchQuery
                    }
                    onChange={(e) => {
                      setDoctorSearchQuery(e.target.value);
                      if (selectedDoctor) setSelectedDoctor(null);
                    }}
                    placeholder="Search doctor by name or department..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-bold transition-all"
                  />
                  {selectedDoctor && (
                    <button
                      onClick={() => setSelectedDoctor(null)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-none text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Doctor Search Dropdown */}
                {doctorSearchQuery &&
                  !selectedDoctor &&
                  filteredDoctors.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-none shadow-xl max-h-48 overflow-y-auto">
                      {filteredDoctors.slice(0, 6).map((doc) => (
                        <button
                          key={doc._id}
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setDoctorSearchQuery("");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-gray-900 text-sm">
                              {doc.name}
                            </span>
                            <span className="ml-2 text-[10px] text-gray-400 uppercase">
                              {doc.department}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-none p-6 space-y-4">
            {isFreeCategory && (
              <div className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-3 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-black uppercase tracking-wide text-sm">
                  {patientType} — Free of Charge
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Subtotal</span>
              <span
                className={isFreeCategory ? "line-through text-gray-400" : ""}
              >
                ₹ {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Hospital Charges</span>
              <span
                className={isFreeCategory ? "line-through text-gray-400" : ""}
              >
                ₹ {isFreeCategory ? "15" : hospitalCharges.toLocaleString()}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Total Amount
              </span>
              <span
                className={`text-2xl font-black ${isFreeCategory ? "text-green-600" : "text-gray-900"}`}
              >
                {isFreeCategory ? "FREE" : `₹ ${totalAmount.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="flex gap-4">
          {!bookingResult ? (
            <>
              <button className="flex-1 group flex items-center justify-center gap-3 px-8 py-5 rounded-none bg-white border-2 border-gray-100 text-gray-900 font-bold hover:border-gray-900 transition-all active:scale-95">
                <ScanLine className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                Generate Lab Code
              </button>
              <button
                onClick={handlePayNow}
                disabled={isSubmitting}
                className="flex-[2] group flex items-center justify-center gap-3 px-8 py-5 rounded-none bg-green-600 text-white font-bold shadow-2xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isFreeCategory ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                {isSubmitting
                  ? "Processing..."
                  : isFreeCategory
                    ? "Proceed & Confirm"
                    : "Pay Now & Confirm"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handlePrint("label")}
                className="flex-1 group flex items-center justify-center gap-3 px-8 py-5 rounded-none bg-white border-2 border-gray-200 text-gray-900 font-bold hover:border-gray-900 transition-all active:scale-95"
              >
                <QrCode className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                Print Sample Label
              </button>
              <button
                onClick={() => handlePrint("receipt")}
                className="flex-[2] group flex items-center justify-center gap-3 px-8 py-5 rounded-none bg-gray-900 text-white font-bold shadow-2xl shadow-gray-300 hover:bg-black transition-all active:scale-95"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Live Preview Card */}
      {/* Right Column: Live Preview Card (Receipt) */}
      <div
        className={cn(
          "w-full xl:w-[400px]",
          printMode === "receipt"
            ? "print:fixed print:inset-0 print:bg-white print:z-[50] print:h-screen print:flex print:items-start print:justify-center"
            : "print:hidden",
        )}
      >
        <div className="sticky top-24 space-y-6 print:static print:space-y-0 print:w-full print:max-w-[80mm]">
          <div className="flex items-center justify-between px-2 print:hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Live Preview
            </h3>
            <span className="text-[10px] font-bold text-gray-300">
              Thermal Printer (80mm)
            </span>
          </div>

          <div
            className="bg-white rounded-none shadow-2xl shadow-gray-200/50 border border-gray-100 px-8 py-10 print:shadow-none print:border-none print:px-0 print:py-0"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Receipt Header */}
            <div className="flex flex-col items-center text-center mb-10">
              <span className="text-2xl font-normal text-gray-700 mb-4">₹</span>
              <h4 className="text-xl font-bold tracking-wide text-gray-900 mb-1">
                JNMC PATHOLOGY
              </h4>
              <p className="text-xs text-gray-500 tracking-wide">
                Medical Road AMU, Aligarh
              </p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 border-t border-gray-200 pt-6 pb-6 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-gray-800">{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="text-gray-800">
                  {bookingResult
                    ? `#${bookingResult.receiptNo}`
                    : previewIds
                      ? `#${previewIds.receiptNo}`
                      : "#INV-001"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sample ID:</span>
                <span className="text-gray-800">
                  {bookingResult
                    ? `#${bookingResult.sampleId}`
                    : previewIds
                      ? `#${previewIds.sampleId}`
                      : "#HIL0001"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coll. By:</span>
                <span className="text-gray-800">{collectorName}</span>
              </div>
              {selectedDoctor && (
                <div className="flex justify-between">
                  <span>Ref. Doctor:</span>
                  <span className="text-gray-800">{selectedDoctor.name}</span>
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div className="space-y-3 border-t border-gray-200 pt-6 pb-6 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="text-gray-800">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>UHID:</span>
                <span className="text-gray-800">
                  {patientUhid || "Not Assigned"}
                </span>
              </div>
            </div>

            {/* Tests Table */}
            <div className="pt-6 pb-8">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-4">
                <span>TEST DESCRIPTION</span>
                <span>AMT</span>
              </div>
              <div className="space-y-4">
                {selectedTests.length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-6">
                    No tests selected
                  </div>
                ) : (
                  selectedTests.map((test) => (
                    <div
                      key={test._id}
                      className="flex justify-between text-xs text-gray-800"
                    >
                      <span>{test.name}</span>
                      <span>{test.price.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-gray-200 pt-6 pb-6 text-xs text-gray-600">
              {isFreeCategory && (
                <div className="text-center font-bold text-green-700 pb-2">
                  ** {patientType.toUpperCase()} - FREE OF CHARGE **
                </div>
              )}
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span
                  className={`text-gray-800 ${isFreeCategory ? "line-through" : ""}`}
                >
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hospital Charges</span>
                <span
                  className={`text-gray-800 ${isFreeCategory ? "line-through" : ""}`}
                >
                  {isFreeCategory ? "15.00" : hospitalCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-6 text-sm font-bold text-gray-900">
                <span>TOTAL</span>
                <span
                  className={`text-lg ${isFreeCategory ? "text-green-700" : ""}`}
                >
                  {isFreeCategory ? "FREE" : `₹ ${totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* QR Code and Footer */}
            <div className="flex flex-col items-center pt-8 pb-4">
              {bookingResult ? (
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/reports/${bookingResult.bookingId}`}
                  size={80}
                  level="M"
                />
              ) : (
                <div className="w-20 h-20 border-2 border-gray-300 flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-gray-400" />
                </div>
              )}
              <p className="text-[11px] text-gray-600 mt-4 font-medium">
                Scan to view report online
              </p>
              <p className="text-[10px] text-gray-400 mt-1 italic">
                Thank you for choosing JNMC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sample Label (Hidden on screen, visible only when printMode='label') */}
      {/* The barcode encodes the sampleId — scanners at each lab stage read this to advance tracking */}
      <div
        className={cn(
          "hidden",
          printMode === "label" &&
            "print:flex print:fixed print:inset-0 print:items-center print:justify-center print:bg-white print:z-[100]",
        )}
      >
        <div
          className="w-[70mm] border border-black p-2 box-border flex flex-col gap-1"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Header row */}
          <div className="flex justify-between items-start border-b border-gray-400 pb-1 mb-1">
            <div className="flex-1 overflow-hidden pr-1">
              <p className="text-[10px] font-bold truncate leading-tight uppercase tracking-tight">
                {patientName || "Patient Name"}
              </p>
              <p className="text-[8px] leading-tight text-gray-700">
                UHID: <span className="font-bold">{patientUhid || "N/A"}</span>
              </p>
              <p className="text-[7px] leading-tight text-gray-600">
                {new Date().toLocaleDateString("en-IN")} &nbsp;|&nbsp; {patientType}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-gray-500 leading-none">Sample ID</p>
              <p className="text-[9px] font-black leading-tight">
                {bookingResult
                  ? bookingResult.sampleId
                  : previewIds
                    ? previewIds.sampleId
                    : "—"}
              </p>
            </div>
          </div>

          {/* Tests */}
          <p className="text-[7px] leading-snug break-words text-gray-700 line-clamp-2">
            <span className="font-bold uppercase text-[6px] text-gray-500">Tests: </span>
            {selectedTests.length > 0
              ? selectedTests.map((t) => t.code || t.name).join(" · ")
              : "No Tests"}
          </p>

          {/* Barcode — the scan target for sample tracking */}
          <div className="flex flex-col items-center mt-1">
            <Barcode
              value={
                bookingResult?.sampleId || previewIds?.sampleId || "SAMPLE"
              }
              width={1.4}
              height={36}
              fontSize={8}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-gray-400 pt-1 mt-1">
            <span className="text-[6px] text-gray-500 uppercase tracking-wide">
              JNMC Pathology
            </span>
            <span className="text-[6px] text-gray-500">
              By: {collectorName.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

const IndianRupee = ({ className }) => (
  <span
    className={className}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2em",
      fontWeight: "bold",
    }}
  >
    ₹
  </span>
);
