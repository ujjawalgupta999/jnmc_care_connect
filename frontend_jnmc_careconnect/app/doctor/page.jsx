"use client";

import PatientLookup from "./patient-lookup";

export default function DoctorPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <a
          href="/doctor/unsigned"
          className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          View Unsigned Reports
        </a>
      </div>
      <PatientLookup />
    </div>
  );
}
