"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Printer,
  FileDown,
  FileText,
  Calendar,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id || "RPT-2023-8492";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-gray-900" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Detailed Lab Report
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-500">
              <span>
                Sample ID:{" "}
                <span className="text-gray-900 font-bold">#{reportId}</span>
              </span>
              <div className="flex items-center gap-1.5"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 mr-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <Calendar className="h-4 w-4" />
            Oct 24, 2023
          </div>

          <Button
            variant="outline"
            className="rounded-xl font-bold h-11 border-gray-200"
            onClick={() => router.push(`/doctor/consult/${reportId}`)}
          >
            <Activity className="mr-2 h-4 w-4 text-blue-600" />
            Consult
          </Button>

          <Button
            variant="outline"
            className="rounded-xl font-bold h-11 border-gray-200"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button className="rounded-xl font-bold h-11 bg-[#050A14] hover:bg-black text-white px-6 shadow-lg shadow-gray-200">
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* PDF Viewer Placeholder */}
      <div className="relative aspect-[1.414/1] w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm overflow-hidden min-h-[600px]">
        <div className="absolute inset-0 m-6 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-24 w-24 rounded-3xl bg-white shadow-xl shadow-gray-200/50 flex items-center justify-center border border-gray-100 animate-pulse">
            <FileText className="h-10 w-10 text-gray-200" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-300">PDF Document View</p>
            <p className="text-sm font-medium text-gray-400 max-w-xs">
              The medical report PDF will be rendered here once digitized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
