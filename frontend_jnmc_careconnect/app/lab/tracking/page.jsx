"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  ScanBarcode,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Columns configuration mapping to status
const COLUMNS = {
  "Sample Collected": {
    title: "Sample Collected",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  "Received by Lab": {
    title: "Received by Lab",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  "Result Released": {
    title: "Released",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
};

export default function LabTrackingBoard() {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [scanValue, setScanValue] = useState("");
  const [scanResult, setScanResult] = useState(null); // { type: 'ok'|'error', message }
  const scanInputRef = useRef(null);

  // Stage progression order
  const STAGE_ORDER = ["Sample Collected", "Received by Lab", "Result Released"];

  const fetchBookings = async () => {
    try {
      // Fetch all tracking board bookings
      const res = await fetch(`${API_URL}/lab/pending?tracking_board=true`);
      const data = await res.json();

      if (data.success) {
        // Group by status
        const grouped = Object.keys(COLUMNS).reduce((acc, status) => {
          acc[status] = [];
          return acc;
        }, {});

        data.bookings.forEach((booking) => {
          if (grouped[booking.status]) {
            grouped[booking.status].push(booking);
          } else if (booking.status === "Pending") {
            // Pending items usually go to "Sample Collected" via scanner, but maybe we show them in a "ToDo" list?
            // For this board, we start from Sample Collected.
            // Logic: Pending -> Scan -> Sample Collected.
          }
        });
        setColumns(grouped);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load tracking board");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Focus scanner input on load
  useEffect(() => {
    if (scanInputRef.current) scanInputRef.current.focus();
  }, [loading]);

  // Auto-clear scan result after 4s
  useEffect(() => {
    if (!scanResult) return;
    const t = setTimeout(() => setScanResult(null), 4000);
    return () => clearTimeout(t);
  }, [scanResult]);

  // Handle barcode scan: find booking by sampleId and advance to next stage
  const handleScan = async () => {
    const sampleId = scanValue.trim();
    if (!sampleId) return;
    setScanValue("");

    // Find booking across all columns
    let found = null;
    let currentStage = null;
    for (const [stage, items] of Object.entries(columns)) {
      const match = items.find(
        (b) => b.sampleId === sampleId || b.sampleId === sampleId.toUpperCase()
      );
      if (match) { found = match; currentStage = stage; break; }
    }

    if (!found) {
      setScanResult({ type: "error", message: `Sample "${sampleId}" not found on board.` });
      return;
    }

    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    if (currentIdx === STAGE_ORDER.length - 1) {
      setScanResult({ type: "error", message: `"${sampleId}" is already at final stage: ${currentStage}.` });
      return;
    }

    const nextStage = STAGE_ORDER[currentIdx + 1];

    // Optimistic update
    const updatedItem = { ...found, status: nextStage };
    setColumns((prev) => ({
      ...prev,
      [currentStage]: prev[currentStage].filter((b) => b._id !== found._id),
      [nextStage]: [updatedItem, ...prev[nextStage]],
    }));

    try {
      const res = await fetch(`${API_URL}/lab/booking/${found._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStage }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setScanResult({ type: "ok", message: `✓ ${sampleId} → ${nextStage}` });
    } catch (err) {
      setScanResult({ type: "error", message: `Update failed: ${err.message}` });
      fetchBookings(); // revert
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    // Optimistic update
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol];
    const destItems = [...destCol];
    const [removed] = sourceItems.splice(source.index, 1);

    // Update status locally
    const updatedItem = { ...removed, status: destination.droppableId };
    destItems.splice(destination.index, 0, updatedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceItems,
      [destination.droppableId]: destItems,
    });

    // API Call
    try {
      const res = await fetch(`${API_URL}/lab/booking/${draggableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destination.droppableId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Moved to ${destination.droppableId}`);
    } catch (error) {
      toast.error("Failed to update status");
      // Revert on error (could be improved)
      fetchBookings();
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="h-[calc(100vh-4rem)] p-6 overflow-x-auto bg-gray-50/50">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lab Workflow Tracking
          </h1>
          <p className="text-sm text-gray-500">
            Scan barcode or drag cards to advance sample stages
          </p>
        </div>

        {/* Barcode Scanner Input */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="relative flex items-center">
            <ScanBarcode className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={scanInputRef}
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Scan or type Sample ID..."
              className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-mono font-bold w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleScan}
              disabled={!scanValue.trim()}
              className="ml-2 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-40"
            >
              Go
            </button>
          </div>
          {scanResult && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                scanResult.type === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {scanResult.type === "ok" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {scanResult.message}
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-[calc(100%-80px)] min-w-max">
          {Object.entries(COLUMNS).map(([status, config]) => (
            <div
              key={status}
              className="w-80 flex flex-col h-full bg-gray-100/50 rounded-xl border border-gray-200"
            >
              <div
                className={cn(
                  "p-4 border-b rounded-t-xl font-bold flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-sm z-10",
                  config.color,
                )}
              >
                <span>{config.title}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded text-xs">
                  {columns[status]?.length || 0}
                </span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-3 overflow-y-auto space-y-3 transition-colors",
                      snapshot.isDraggingOver ? "bg-blue-50/50" : "",
                    )}
                  >
                    {columns[status]?.map((booking, index) => (
                      <Draggable
                        key={booking._id}
                        draggableId={booking._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group",
                              snapshot.isDragging &&
                                "ring-2 ring-blue-500 rotate-1 shadow-xl z-50",
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                {booking.sampleId || "NO-SAMPLE-ID"}
                              </span>
                              {booking.flags?.isCriticalValue && (
                                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                              )}
                            </div>

                            <h4 className="font-bold text-gray-900 truncate mb-1">
                              {booking.patientId?.name || booking.patientName || "Unknown"}
                            </h4>

                            <div className="space-y-1.5">
                              <div className="flex items-center text-xs text-gray-500">
                                <FileText className="h-3 w-3 mr-1.5" />
                                <span className="truncate max-w-[180px]">
                                  {booking.tests
                                    ?.map((t) => t.testName)
                                    .join(", ") || "No tests"}
                                </span>
                              </div>

                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1.5" />
                                <span>
                                  {/* Calculate time in current stage if possible */}
                                  {booking.tatTimestamps &&
                                  booking.tatTimestamps[getTimestampKey(status)]
                                    ? formatTimeSince(
                                        booking.tatTimestamps[
                                          getTimestampKey(status)
                                        ],
                                      )
                                    : "Just now"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

// Helper to map status to timestamp key
function getTimestampKey(status) {
  const map = {
    "Sample Collected": "sampleCollectedAt",
    "In Transit": "transportStartedAt",
    "Received by Lab": "labReceivedAt",
    Processing: "analysisStartedAt",
    "Awaiting Validation": "analysisCompletedAt",
    "Result Released": "resultReleasedAt",
  };
  return map[status];
}

function formatTimeSince(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 60000); // minutes

  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
